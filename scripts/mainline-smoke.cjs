const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const targetUrl = process.env.PROGRAM_A_URL || "http://127.0.0.1:5173/";
const outputDir = path.resolve(__dirname, "../artifacts/mainline-smoke");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getVisibleState(page) {
  return page.evaluate(() => window.programA.programB.getVisibleState());
}

async function completeChallenge(page) {
  const challenge = (await getVisibleState(page)).dailyFlow.challenge;
  assert(challenge, "Expected a daily challenge.");
  const answers = challenge.tasks.map((task) => ({
    taskId: task.id,
    optionIds: task.options.length > 0 ? [task.options[0].id] : [],
  }));
  await page.evaluate(
    ({ challengeId, kind, answers }) => {
      window.programA.submitDailyChallenge(challengeId, { kind, answers });
    },
    { challengeId: challenge.id, kind: challenge.kind, answers },
  );
  assert(
    (await getVisibleState(page)).dailyFlow.challenge.status === "success",
    "Challenge did not reach success.",
  );
}

async function sealCurrentDayPackage(page) {
  const state = await getVisibleState(page);
  const needed = state.day === 7 ? 1 : 3;
  assert(state.rawCards.length >= needed, "Not enough raw cards for package test.");
  for (let index = 0; index < needed; index += 1) {
    await page.evaluate(
      ({ cardId, slotIndex }) => window.programA.placeCardToSlot(cardId, slotIndex),
      { cardId: state.rawCards[index].id, slotIndex: index },
    );
  }
  await page.evaluate(() => window.programA.createPackage());
  const next = await getVisibleState(page);
  assert(next.dailyFlow.phase === "trading", "Package did not advance to trading.");
  assert(next.processedPackages.length > 0, "Package was not generated.");
}

async function sellFirstPackage(page) {
  const state = await getVisibleState(page);
  const packageId = state.processedPackages.at(-1)?.id;
  const buyerId = state.buyers[0]?.id;
  assert(packageId && buyerId, "Package or buyer missing for transaction test.");
  await page.evaluate(
    ({ packageId, buyerId }) => {
      window.programA.selectPackage(packageId);
      window.programA.selectBuyer(buyerId);
      window.programA.submitTransaction(packageId, buyerId);
    },
    { packageId, buyerId },
  );
  assert(
    (await getVisibleState(page)).dailyFlow.phase === "monologue",
    "Successful transaction did not advance to monologue.",
  );
}

async function run() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.programA));
  const canvas = await page.locator("canvas").boundingBox();
  assert(canvas && canvas.width > 0 && canvas.height > 0, "Canvas is blank or missing.");
  await page.screenshot({ path: path.join(outputDir, "portrait.png"), fullPage: true });

  await page.evaluate(() => {
    window.programA.programB.setMockDay(2, "processing");
    window.programA.switchScene("monitor-desktop");
  });
  const debugDetails = page.locator("details").first();
  if ((await debugDetails.count()) > 0 && (await debugDetails.getAttribute("open")) !== null) {
    await debugDetails.locator("summary").click();
  }
  await page.screenshot({ path: path.join(outputDir, "monitor-home.png"), fullPage: true });
  await page.mouse.click(76, 334);
  await page.waitForTimeout(100);
  const monitorState = await page.evaluate(
    () => window.programA.getSnapshot().monitorDesktop,
  );
  assert(monitorState.currentApp === "risk-record", "Risk app icon did not open risk-record.");
  await page.screenshot({ path: path.join(outputDir, "risk-record.png"), fullPage: true });

  await page.evaluate(() => window.programA.programB.setMockDay(2, "news"));
  let state = await getVisibleState(page);
  assert(state.rawCards.length === 8, "Day 2 should provide 8 mock cards.");
  await page.evaluate(() => window.programA.advanceDailyPhase());
  assert((await getVisibleState(page)).dailyFlow.phase === "emotion", "Day 2 news -> emotion failed.");
  const clarityBefore = (await getVisibleState(page)).clarityScore;
  await page.evaluate(() => window.programA.selectEmotion("empathy"));
  state = await getVisibleState(page);
  assert(state.dailyFlow.phase === "briefing", "Day 2 emotion -> briefing failed.");
  assert(state.clarityScore === clarityBefore + 1, "Empathy should add 1 clarity.");
  await page.evaluate(() => window.programA.advanceDailyPhase());
  assert((await getVisibleState(page)).dailyFlow.phase === "challenge", "Day 2 briefing -> challenge failed.");
  await completeChallenge(page);
  await page.evaluate(() => window.programA.advanceDailyPhase());
  assert((await getVisibleState(page)).dailyFlow.phase === "processing", "Day 2 challenge -> processing failed.");
  await sealCurrentDayPackage(page);
  await sellFirstPackage(page);
  await page.evaluate(() => window.programA.advanceDailyPhase());
  state = await getVisibleState(page);
  assert(state.day === 3 && state.dailyFlow.phase === "news", "Day 2 monologue -> Day 3 news failed.");

  await page.evaluate(() => window.programA.programB.setMockDay(7, "news"));
  assert((await getVisibleState(page)).rawCards.length === 1, "Day 7 should provide 1 employee card.");
  await page.evaluate(() => window.programA.advanceDailyPhase());
  assert((await getVisibleState(page)).dailyFlow.phase === "briefing", "Day 7 news -> briefing failed.");
  await page.evaluate(() => window.programA.advanceDailyPhase());
  assert((await getVisibleState(page)).dailyFlow.phase === "emotion", "Day 7 briefing -> emotion failed.");
  await page.evaluate(() => window.programA.selectEmotion("anger"));
  assert((await getVisibleState(page)).dailyFlow.phase === "challenge", "Day 7 emotion -> challenge failed.");
  await completeChallenge(page);
  await page.evaluate(() => window.programA.advanceDailyPhase());
  await sealCurrentDayPackage(page);
  await sellFirstPackage(page);
  await page.evaluate(() => window.programA.advanceDailyPhase());
  state = await getVisibleState(page);
  assert(state.dailyFlow.phase === "ending" && state.ending.available, "Day 7 did not reach ending.");

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  const landscapeCanvas = await page.locator("canvas").boundingBox();
  assert(
    landscapeCanvas && landscapeCanvas.width > 0 && landscapeCanvas.height > 0,
    "Landscape canvas is blank or missing.",
  );
  await page.screenshot({ path: path.join(outputDir, "landscape.png"), fullPage: true });
  assert(runtimeErrors.length === 0, `Runtime errors: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    ok: true,
    targetUrl,
    portraitCanvas: canvas,
    landscapeCanvas,
    finalDay: state.day,
    finalPhase: state.dailyFlow.phase,
    openedApp: monitorState.currentApp,
    screenshots: outputDir,
  }, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
