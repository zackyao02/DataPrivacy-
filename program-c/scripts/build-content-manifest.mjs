import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const dataPath = join(rootPath, "data");
const outputPath = join(rootPath, "dist", "content-manifest.json");

function readJson(name) {
  return JSON.parse(readFileSync(join(dataPath, name), "utf8"));
}

function readSoundEvents() {
  const soundMapSource = readFileSync(join(rootPath, "src", "audio", "soundMap.ts"), "utf8");
  const objectBody = soundMapSource.match(/SOUND_EVENT_MAP\s*=\s*\{([\s\S]*?)\}\s*as const/)?.[1] ?? "";

  return [...objectBody.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm)].map((match) => match[1]);
}

const cardTemplates = readJson("card_templates.json");
const users = readJson("users.json");
const buyers = readJson("buyers.json");
const buyerNegotiationScripts = readJson("buyer_negotiation_scripts.json");
const newsTemplates = readJson("news_templates.json");
const protocolTerms = readJson("protocol_terms.json");
const packageRecipes = readJson("package_recipes.json");
const dayChallenges = readJson("day_challenges.json");
const dataCleaningIcons = readJson("data_cleaning_icons.json");
const dailyMonologues = readJson("daily_monologues.json");
const profilePuzzles = readJson("profile_puzzles.json");
const publicOpinionScripts = readJson("public_opinion_scripts.json");
const blackBoxLines = readJson("black_box_lines.json");

const manifest = {
  role: "Program C - content tools, audio, build and performance",
  budgetBytes: 8 * 1024 * 1024,
  contentFiles: [
    "card_templates.json",
    "users.json",
    "buyers.json",
    "buyer_negotiation_scripts.json",
    "variables.json",
    "news_templates.json",
    "protocol_terms.json",
    "package_recipes.json",
    "day_challenges.json",
    "data_cleaning_icons.json",
    "daily_monologues.json",
    "profile_puzzles.json",
    "public_opinion_scripts.json",
    "black_box_lines.json",
  ],
  counts: {
    cardTemplates: cardTemplates.length,
    users: users.length,
    buyers: buyers.length,
    buyerNegotiationScripts: buyerNegotiationScripts.length,
    newsTemplates: newsTemplates.length,
    protocolTerms: protocolTerms.length,
    packageRecipes: packageRecipes.length,
    dayChallenges: dayChallenges.length,
    dataCleaningIcons: dataCleaningIcons.length,
    dailyMonologues: dailyMonologues.length,
    profilePuzzles: profilePuzzles.length,
    publicOpinionScripts: publicOpinionScripts.length,
    blackBoxLines: blackBoxLines.length,
  },
  dataTypes: [...new Set(cardTemplates.map((card) => card.dataType))].sort(),
  sensitivityLevels: [...new Set(cardTemplates.map((card) => card.sensitivity))].sort(),
  packageTypes: packageRecipes.map((recipe) => recipe.packageType).sort(),
  playableDays: dayChallenges.map((challenge) => challenge.day).sort((a, b) => a - b),
  dayChallengeTypes: [...new Set(dayChallenges.map((challenge) => challenge.type))].sort(),
  repositoryCapabilities: [
    "pickUser",
    "pickCard",
    "fillVariables",
    "getDayChallenges",
    "getDataCleaningIcons",
    "getPublicOpinionScripts",
    "getProfilePuzzles",
    "getBuyerNegotiationScripts",
    "getDailyMonologues",
    "getBlackBoxLines",
    "findChallengeByDay",
    "findChallengesByType",
    "findDataCleaningIcon",
    "findPublicOpinionScriptsForPackage",
    "pickPublicOpinionScript",
    "findProfilePuzzlesByDay",
    "findProfilePuzzleByDay",
    "pickProfilePuzzleByDay",
    "findBuyerNegotiationsByDay",
    "findBuyerNegotiationsForPackage",
    "pickBuyerNegotiationScript",
    "findDailyMonologueByDay",
    "findBlackBoxLinesByStage",
    "findBlackBoxLinesForChallenge",
    "findBlackBoxLinesForPackage",
    "pickBlackBoxLine",
    "findCardsByDataType",
    "findCardsByIds",
    "findRecipesForDataTypes",
    "createPackagePreview",
    "findPackagePreviews",
    "findBuyersForPackage",
    "findNewsForPackage",
    "pickNewsForPackage",
  ],
  soundEvents: readSoundEvents(),
  sharedState: {
    conscience: "清醒值 / 良知值，内部统一变量名使用 conscience",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
