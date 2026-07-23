import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContains(source, value, label) {
  assert(source.includes(value), `${label} is missing ${value}`);
}

const integrationSource = read("src/integration/createProgramCIntegration.ts");
const integrationIndexSource = read("src/integration/index.ts");
const packageIndexSource = read("src/index.ts");
const appSource = read("../src/app/ProgramACanvasApp.ts");
const mainSource = read("../src/main.ts");
const gamePortsSource = read("../src/game/GamePorts.ts");
const visibleStateSource = read("../src/game/VisibleGameState.ts");
const weekOneBAdapterSource = read("../src/game/WeekOneProgramBAdapter.ts");

const contentDebugMethods = [
  "findPackagePreviews",
  "pickNewsForPackage",
  "findChallengeByDay",
  "findDataCleaningIcon",
  "pickPublicOpinionScript",
  "pickProfilePuzzleByDay",
  "pickBuyerNegotiationScript",
  "pickProtocolScanTemplate",
  "pickEvidenceChainTemplate",
  "pickEndingReportTemplate",
  "findDailyMonologueByDay",
  "pickBlackBoxLine",
];

const audioMethods = [
  "unlock",
  "handleGameEvent",
  "setEnabled",
  "setMasterVolume",
  "destroy",
];

const programBCommands = [
  "submitCardToOperationPad",
  "placeCardToSlot",
  "removeCardFromSlot",
  "createPackage",
  "sellPackage",
  "submitDailyChallengeChoice",
  "submitDailyChallenge",
  "selectEmotion",
  "advanceDailyPhase",
];

for (const method of contentDebugMethods) {
  assertContains(integrationSource, method, "Program C content debug contract");
}

for (const method of audioMethods) {
  assertContains(integrationSource, method, "Program C audio contract");
}

assertContains(
  integrationSource,
  "programAIntegrations",
  "Program A integration registry contract",
);
assertContains(
  integrationSource,
  "createProgramCIntegration",
  "Program C integration factory",
);
assertContains(
  integrationSource,
  "installProgramCIntegration",
  "Program C integration installer",
);
assertContains(integrationIndexSource, "./createProgramCIntegration", "integration index");
assertContains(packageIndexSource, "./integration", "package root index");
assertContains(appSource, "createProgramCIntegration", "integrated app bridge");
assertContains(appSource, "contentDebug", "integrated app bridge");
assertContains(mainSource, "programAIntegrations", "window registry install");
assertContains(mainSource, "programB: app.debugApi.programB.runtimeBinding", "window registry install");
assertContains(mainSource, "programC: app.debugApi.programC.integration", "window registry install");

assertContains(gamePortsSource, "DailyChallengeResponse", "Program A game ports");
assertContains(gamePortsSource, "GameCommandPort", "Program A game ports");
assertContains(visibleStateSource, "VisibleGameState", "Program A visible state");
assertContains(visibleStateSource, "VisibleDailyFlow", "Program A visible state");
assertContains(weekOneBAdapterSource, "WeekOneProgramBAdapter", "Program B Week One adapter");
assertContains(weekOneBAdapterSource, "runtimeBinding", "Program B Week One adapter");
assertContains(weekOneBAdapterSource, "getVisibleState", "Program B Week One adapter");

for (const command of programBCommands) {
  assertContains(weekOneBAdapterSource, command, "Program B runtime command contract");
}

console.log("Program A/B/C integration contract passed.");
