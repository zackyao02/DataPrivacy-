import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const root = new URL("..", import.meta.url);
const dataDir = new URL("data/", root);
const distDir = new URL("dist/", root);
const docsDir = new URL("docs/", root);
const outputJson = new URL("week1-vertical-slice-report.json", distDir);
const outputMd = new URL("week1-vertical-slice-report.md", docsDir);
const budgetBytes = 8 * 1024 * 1024;
const refreshBenchmark = process.env.PROGRAM_C_REFRESH_BENCHMARK === "1";

const requiredAudioEvents = [
  "packageCreated",
  "packageSealed",
  "transactionSuccess",
  "transactionSealed",
  "newsBroadcast",
  "newsTicker",
  "publicOpinionPulse",
  "challengeSuccess",
  "challengeFail",
  "blackBoxLine",
  "challengeBgm",
  "endingTriggered",
  "monologueType",
  "bgmBlackBox",
  "bgmPressure",
  "bgmSilence",
];

const requiredWeek1Days = [1, 2, 3, 4, 5];
const d8PrototypeDays = [6];
const d9PrototypeDays = [7];
const requiredPackageTypes = [
  "precise_profile",
  "health_risk",
  "career_competitiveness",
  "credit_score",
  "relationship_infiltration",
];

function readJson(name) {
  return JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));
}

function readExistingMarkdownMatch(pattern) {
  if (!existsSync(outputMd)) {
    return undefined;
  }

  return readFileSync(outputMd, "utf8").match(pattern)?.[1];
}

function writeIfChanged(file, content) {
  if (existsSync(file) && readFileSync(file, "utf8") === content) {
    return;
  }

  writeFileSync(file, content, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function walk(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = new URL(entry.name, `${dir.href}${dir.href.endsWith("/") ? "" : "/"}`);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function relativeToRoot(file) {
  return decodeURIComponent(file.href.replace(root.href, "")).replace(/\//g, "\\");
}

function readSoundMap() {
  const source = readFileSync(new URL("src/audio/soundMap.ts", root), "utf8");
  const objectBody = source.match(/SOUND_EVENT_MAP\s*=\s*\{([\s\S]*?)\}\s*as const/)?.[1] ?? "";
  const pairs = [...objectBody.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*"([^"]+)"/gm)];

  return Object.fromEntries(pairs.map((match) => [match[1], match[2]]));
}

function readPreviewEvents() {
  const html = readFileSync(new URL("docs/audio-preview.html", root), "utf8");
  const mapBody = html.match(/SOUND_EVENT_MAP\s*=\s*\{([\s\S]*?)\}\s*;/)?.[1] ?? "";
  const mappedEvents = [...mapBody.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm)].map(
    (match) => match[1],
  );
  const buttonEvents = [...html.matchAll(/\["([A-Za-z][A-Za-z0-9_]*)",\s*"/g)].map(
    (match) => match[1],
  );

  return {
    mappedEvents,
    buttonEvents,
    missingButtons: mappedEvents.filter((event) => !buttonEvents.includes(event)),
    extraButtons: buttonEvents.filter((event) => !mappedEvents.includes(event)),
  };
}

function measureDataParse(dataFiles) {
  const sources = dataFiles.map((name) => readFileSync(new URL(name, dataDir), "utf8"));
  const iterations = 40;
  const started = performance.now();

  for (let index = 0; index < iterations; index += 1) {
    for (const source of sources) {
      JSON.parse(source);
    }
  }

  return {
    iterations,
    totalMs: Number((performance.now() - started).toFixed(3)),
    averageMsPerFullPass: Number(((performance.now() - started) / iterations).toFixed(3)),
  };
}

const dataFiles = readdirSync(dataDir)
  .filter((name) => name.endsWith(".json"))
  .sort();

const cards = readJson("card_templates.json");
const users = readJson("users.json");
const buyers = readJson("buyers.json");
const recipes = readJson("package_recipes.json");
const news = readJson("news_templates.json");
const dayChallenges = readJson("day_challenges.json");
const profilePuzzles = readJson("profile_puzzles.json");
const negotiations = readJson("buyer_negotiation_scripts.json");
const protocolScanTemplates = readJson("protocol_scan_templates.json");
const evidenceChainTemplates = readJson("evidence_chain_templates.json");
const monologues = readJson("daily_monologues.json");
const soundMap = readSoundMap();
const previewEvents = readPreviewEvents();
const existingGeneratedAt = readExistingMarkdownMatch(/^Generated:\s+(.+)$/m);
const existingParseAverage = Number(
  readExistingMarkdownMatch(
    /^\| JSON parse average per full pass \| ([0-9.]+) ms \|$/m,
  ),
);

const packageTypes = recipes.map((recipe) => recipe.packageType);
const challengeDays = dayChallenges.map((challenge) => challenge.day).sort((a, b) => a - b);
const monologueDays = monologues.map((monologue) => monologue.day).sort((a, b) => a - b);
const soundEvents = Object.keys(soundMap);
const trackedFiles = ["data", "src", "dist"]
  .map((dir) => new URL(`${dir}/`, root))
  .filter((dir) => existsSync(dir))
  .flatMap((dir) => walk(dir))
  .filter((file) => {
    const relativePath = relativeToRoot(file);
    return (
      !relativePath.endsWith("dist\\gzip-size-report.json") &&
      !relativePath.endsWith("dist\\week1-vertical-slice-report.json")
    );
  });

const rawBytes = trackedFiles.reduce((sum, file) => sum + statSync(file).size, 0);
const gzipBytes = trackedFiles.reduce(
  (sum, file) => sum + gzipSync(readFileSync(file), { level: 9 }).length,
  0,
);
const measuredParseBench = measureDataParse(dataFiles);
const parseBench =
  Number.isFinite(existingParseAverage) && !refreshBenchmark
    ? {
        ...measuredParseBench,
        averageMsPerFullPass: existingParseAverage,
      }
    : measuredParseBench;

for (const packageType of requiredPackageTypes) {
  assert(packageTypes.includes(packageType), `missing package type: ${packageType}`);
  assert(
    news.some((item) => item.relatedPackageType === packageType),
    `missing news for package type: ${packageType}`,
  );
  assert(
    buyers.some((buyer) => buyer.acceptedPackageTypes.includes(packageType)),
    `missing buyer for package type: ${packageType}`,
  );
  assert(
    negotiations.some((script) => script.packageType === packageType),
    `missing negotiation script for package type: ${packageType}`,
  );
}

for (const day of requiredWeek1Days) {
  assert(challengeDays.includes(day), `missing week1 challenge day: ${day}`);
}

for (const day of d8PrototypeDays) {
  assert(challengeDays.includes(day), `missing D8 prototype challenge day: ${day}`);
}

for (const day of d9PrototypeDays) {
  assert(challengeDays.includes(day), `missing D9 prototype challenge day: ${day}`);
}

for (let day = 1; day <= 7; day += 1) {
  assert(monologueDays.includes(day), `missing daily monologue day: ${day}`);
}

for (const event of requiredAudioEvents) {
  assert(soundEvents.includes(event), `missing audio event: ${event}`);
}

assert(soundMap.packageCreated === "package-seal", "packageCreated must use package-seal");
assert(soundMap.packageSealed === "package-seal", "packageSealed must use package-seal");
assert(
  soundMap.transactionSealed === "transaction-seal",
  "transactionSealed must use transaction-seal",
);
assert(previewEvents.missingButtons.length === 0, "audio preview has mapped events without buttons");
assert(previewEvents.extraButtons.length === 0, "audio preview has buttons without mapped events");
assert(rawBytes < budgetBytes, "raw tracked files exceed 8MB budget");
assert(gzipBytes < budgetBytes, "gzip tracked files exceed 8MB budget");

const report = {
  generatedAt:
    process.env.PROGRAM_C_REPORT_GENERATED_AT ??
    existingGeneratedAt ??
    new Date().toISOString(),
  scope: "Program C D7 baseline plus D8/D9 playable mini-game readiness",
  week1Coverage: {
    supportedChallengeDays: challengeDays,
    requiredWeek1Days,
    d8PrototypeDays,
    d9PrototypeDays,
    packageTypes,
    counts: {
      cardTemplates: cards.length,
      users: users.length,
      buyers: buyers.length,
      packageRecipes: recipes.length,
      newsTemplates: news.length,
      dayChallenges: dayChallenges.length,
      profilePuzzles: profilePuzzles.length,
      buyerNegotiationScripts: negotiations.length,
      protocolScanTemplates: protocolScanTemplates.length,
      evidenceChainTemplates: evidenceChainTemplates.length,
      dailyMonologues: monologues.length,
      soundEvents: soundEvents.length,
      audioPreviewButtons: previewEvents.buttonEvents.length,
    },
  },
  audioIntegration: {
    requiredAudioEvents,
    packageSealEvents: {
      packageCreated: soundMap.packageCreated,
      packageSealed: soundMap.packageSealed,
      transactionSealed: soundMap.transactionSealed,
    },
    previewMatched: true,
  },
  performanceInitialCheck: {
    rawBytes,
    gzipBytes,
    budgetBytes,
    remainingRawBytes: budgetBytes - rawBytes,
    remainingGzipBytes: budgetBytes - gzipBytes,
    dataJsonFiles: dataFiles.length,
    dataParseBenchmark: parseBench,
    fpsRiskProxy: {
      status: "low-risk-for-program-c-assets",
      reasons: [
        "Program C uses JSON presets and procedural Web Audio; no remote runtime assets are required.",
        "Tracked raw assets stay far below the 8MB budget.",
        "Actual FPS must be measured by Program A in the integrated canvas build.",
      ],
    },
  },
  handoffNotes: [
    "Program B should run the playable Day 1/2/3/4/5/6/7 loop using findChallengeByDay, package news, emotion responses, public opinion choices, protocol scan state, evidence chain state, and daily monologues.",
    "Program A should verify audio.handleGameEvent for package seal, transaction seal, challenge feedback, BGM, monologue typing, and endingTriggered prototype events.",
    "Program C performance numbers here cover content/audio/build assets; integrated FPS belongs to the A/B vertical slice run.",
  ],
};

mkdirSync(distDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeIfChanged(outputJson, `${JSON.stringify(report, null, 2)}\n`);

const markdown = `# Program C Vertical Slice Report

Generated: ${report.generatedAt}

## Scope

This report keeps the D7 Week 1 acceptance baseline and adds the D8/D9 playable mini-game / ending-prototype readiness check.

## Content Coverage

| Item | Count |
| --- | ---: |
| Card templates | ${cards.length} |
| Users | ${users.length} |
| Buyers | ${buyers.length} |
| Package recipes | ${recipes.length} |
| News templates | ${news.length} |
| Day challenges | ${dayChallenges.length} |
| Profile puzzles | ${profilePuzzles.length} |
| Buyer negotiation scripts | ${negotiations.length} |
| Protocol scan templates | ${protocolScanTemplates.length} |
| Evidence chain templates | ${evidenceChainTemplates.length} |
| Daily monologues | ${monologues.length} |

D7 required challenge days: ${requiredWeek1Days.join(", ")}.

D8 prototype challenge days: ${d8PrototypeDays.join(", ")}.

D9 prototype challenge days: ${d9PrototypeDays.join(", ")}.

Supported Program C challenge days: ${challengeDays.join(", ")}.

Package types: ${packageTypes.join(", ")}.

## Audio Integration

Audio event count: ${soundEvents.length}.

Package sealing check:

| Event | Sound ID |
| --- | --- |
| packageCreated | ${soundMap.packageCreated} |
| packageSealed | ${soundMap.packageSealed} |
| transactionSealed | ${soundMap.transactionSealed} |

Audio preview buttons matched: yes (${previewEvents.buttonEvents.length} buttons).

## Initial Performance Check

| Metric | Value |
| --- | ---: |
| Raw tracked bytes | ${rawBytes} |
| Gzip tracked bytes | ${gzipBytes} |
| Budget bytes | ${budgetBytes} |
| Remaining raw bytes | ${budgetBytes - rawBytes} |
| Remaining gzip bytes | ${budgetBytes - gzipBytes} |
| Data JSON files | ${dataFiles.length} |
| JSON parse average per full pass | ${parseBench.averageMsPerFullPass} ms |

FPS risk proxy: low for Program C assets. Program C currently ships JSON presets and procedural Web Audio only. Actual FPS still needs Program A to measure in the integrated canvas build.

## Handoff

- Program B: run Day 1/2/3/4/5/6/7 loop with \`findChallengeByDay\`, package news, emotion responses, public opinion choices, protocol scan state, evidence chain state, and daily monologues.
- Program A: verify \`audio.handleGameEvent\` for package seal, transaction seal, challenge feedback, BGM, monologue typing, and \`endingTriggered\` prototype events.
- Program C: rerun \`npm run check\` before each content or audio handoff.
`;

writeIfChanged(outputMd, markdown);
console.log(`Wrote ${decodeURIComponent(outputJson.pathname)}`);
console.log(`Wrote ${decodeURIComponent(outputMd.pathname)}`);
console.log("Program C vertical slice readiness passed.");
