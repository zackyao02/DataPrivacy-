import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const dataDir = new URL("data/", root);

const dataTypes = new Set([
  "social",
  "location",
  "consumption",
  "biometric",
  "health",
  "contact_graph",
]);
const sensitivities = new Set(["low", "medium", "high"]);
const dayChallengeTypes = new Set(["protocol_match", "data_cleaning"]);
const dataCleaningTrapTypes = new Set(["backup_file", "audit_log", "system_file"]);
const variableKeys = ["姓名", "城市", "金额", "平台"];
const emotionKeys = ["empathy", "anger", "numbness"];
const placeholderPattern = /\{([^}]+)\}/g;

function readJson(name) {
  return JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUniqueIds(items, label) {
  const seen = new Set();

  for (const item of items) {
    assert(typeof item.id === "string" && item.id.length > 0, `${label} has empty id`);
    assert(!seen.has(item.id), `${label} duplicate id: ${item.id}`);
    seen.add(item.id);
  }
}

function collectPlaceholders(text) {
  return [...String(text ?? "").matchAll(placeholderPattern)].map((match) => match[1]);
}

function assertKnownPlaceholders(text, label, variables) {
  for (const key of collectPlaceholders(text)) {
    assert(Array.isArray(variables[key]), `${label} references unknown placeholder: ${key}`);
  }
}

const cardTemplates = readJson("card_templates.json");
const users = readJson("users.json");
const buyers = readJson("buyers.json");
const variables = readJson("variables.json");
const newsTemplates = readJson("news_templates.json");
const protocolTerms = readJson("protocol_terms.json");
const recipes = readJson("package_recipes.json");
const dayChallenges = readJson("day_challenges.json");

assertUniqueIds(cardTemplates, "card_templates");
assertUniqueIds(users, "users");
assertUniqueIds(buyers, "buyers");
assertUniqueIds(newsTemplates, "news_templates");
assertUniqueIds(protocolTerms, "protocol_terms");
assertUniqueIds(recipes, "package_recipes");
assertUniqueIds(dayChallenges, "day_challenges");

assert(cardTemplates.length >= 10, "card_templates needs at least 10 templates for Program C Day 2");
assert(users.length >= 20, "users needs at least 20 profiles for Program C Day 2");
assert(newsTemplates.length >= 20, "news_templates needs at least 20 templates for Program C D4");
assert(protocolTerms.length >= 20, "protocol_terms needs at least 20 pairs for Program C D4");

for (const key of variableKeys) {
  assert(Array.isArray(variables[key]), `variables missing array: ${key}`);
  assert(variables[key].length > 0, `variables empty array: ${key}`);
}

for (const key of Object.keys(variables)) {
  assert(variableKeys.includes(key), `variables contains unsupported key: ${key}`);
}

for (const dataType of dataTypes) {
  assert(
    cardTemplates.some((card) => card.dataType === dataType),
    `card_templates missing dataType coverage: ${dataType}`,
  );
}

const cardDataTypes = new Set(cardTemplates.map((card) => card.dataType));

for (const card of cardTemplates) {
  assert(dataTypes.has(card.dataType), `card ${card.id} invalid dataType: ${card.dataType}`);
  assert(
    sensitivities.has(card.sensitivity),
    `card ${card.id} invalid sensitivity: ${card.sensitivity}`,
  );
  assert(Array.isArray(card.userProfileTags), `card ${card.id} missing userProfileTags`);
  assertKnownPlaceholders(card.title, `card ${card.id} title`, variables);
  assertKnownPlaceholders(card.description, `card ${card.id} description`, variables);

  const usedVariables = new Set([
    ...collectPlaceholders(card.title),
    ...collectPlaceholders(card.description),
  ]);

  for (const key of card.variables ?? []) {
    assert(Array.isArray(variables[key]), `card ${card.id} declares unknown variable: ${key}`);
    assert(usedVariables.has(key), `card ${card.id} declares unused variable: ${key}`);
  }

  for (const key of usedVariables) {
    assert(
      card.variables?.includes(key),
      `card ${card.id} uses undeclared variable: ${key}`,
    );
  }
}

const packageTypes = new Set(recipes.map((recipe) => recipe.packageType));
const protocolTermIds = new Set(protocolTerms.map((term) => term.id));

for (const packageType of packageTypes) {
  assert(
    newsTemplates.filter((news) => news.relatedPackageType === packageType).length >= 2,
    `news_templates needs at least 2 templates for package: ${packageType}`,
  );
}

for (const recipe of recipes) {
  assert(
    Array.isArray(recipe.requiredDataTypes) && recipe.requiredDataTypes.length > 0,
    `recipe ${recipe.id} missing requiredDataTypes`,
  );

  for (const dataType of recipe.requiredDataTypes) {
    assert(dataTypes.has(dataType), `recipe ${recipe.id} invalid dataType: ${dataType}`);
    assert(
      cardDataTypes.has(dataType),
      `recipe ${recipe.id} cannot be assembled because no card covers: ${dataType}`,
    );
  }

  assert(
    buyers.some((buyer) => buyer.acceptedPackageTypes.includes(recipe.packageType)),
    `recipe ${recipe.id} has no buyer for package: ${recipe.packageType}`,
  );
  assert(
    newsTemplates.some((news) => news.relatedPackageType === recipe.packageType),
    `recipe ${recipe.id} has no news template for package: ${recipe.packageType}`,
  );
}

for (const buyer of buyers) {
  assert(
    Array.isArray(buyer.acceptedPackageTypes) && buyer.acceptedPackageTypes.length > 0,
    `buyer ${buyer.id} missing acceptedPackageTypes`,
  );

  for (const packageType of buyer.acceptedPackageTypes) {
    assert(packageTypes.has(packageType), `buyer ${buyer.id} references unknown package: ${packageType}`);
  }
}

for (const news of newsTemplates) {
  assert(
    packageTypes.has(news.relatedPackageType),
    `news ${news.id} references unknown package: ${news.relatedPackageType}`,
  );
  assertKnownPlaceholders(news.headline, `news ${news.id} headline`, variables);
  assertKnownPlaceholders(news.body, `news ${news.id} body`, variables);

  for (const emotionKey of emotionKeys) {
    assert(news.emotionResponses?.[emotionKey], `news ${news.id} missing ${emotionKey} response`);
    assertKnownPlaceholders(
      news.emotionResponses[emotionKey],
      `news ${news.id} ${emotionKey} response`,
      variables,
    );
  }
}

const challengeDays = new Set(dayChallenges.map((challenge) => challenge.day));
assert(challengeDays.has(1), "day_challenges missing Day 1 challenge");
assert(challengeDays.has(2), "day_challenges missing Day 2 challenge");

for (const challenge of dayChallenges) {
  assert(
    Number.isInteger(challenge.day) && challenge.day >= 1 && challenge.day <= 7,
    `challenge ${challenge.id} invalid day: ${challenge.day}`,
  );
  assert(
    dayChallengeTypes.has(challenge.type),
    `challenge ${challenge.id} invalid type: ${challenge.type}`,
  );
  assert(
    Number.isInteger(challenge.timeLimitSeconds) && challenge.timeLimitSeconds > 0,
    `challenge ${challenge.id} invalid timeLimitSeconds`,
  );
  assert(challenge.title, `challenge ${challenge.id} missing title`);
  assert(challenge.briefing, `challenge ${challenge.id} missing briefing`);
  assert(challenge.objective, `challenge ${challenge.id} missing objective`);
  assert(challenge.badge, `challenge ${challenge.id} missing badge`);
  assert(challenge.successText, `challenge ${challenge.id} missing successText`);
  assert(challenge.failText, `challenge ${challenge.id} missing failText`);

  if (challenge.type === "protocol_match") {
    assert(
      Array.isArray(challenge.protocolTermIds) && challenge.protocolTermIds.length >= 4,
      `challenge ${challenge.id} needs at least 4 protocol terms`,
    );

    for (const termId of challenge.protocolTermIds) {
      assert(
        protocolTermIds.has(termId),
        `challenge ${challenge.id} references unknown protocol term: ${termId}`,
      );
    }
  }

  if (challenge.type === "data_cleaning") {
    const condition = challenge.successCondition;
    assert(condition, `challenge ${challenge.id} missing successCondition`);
    assert(
      Number.isInteger(condition.requiredSensitiveClicks) &&
        condition.requiredSensitiveClicks > 0,
      `challenge ${challenge.id} invalid requiredSensitiveClicks`,
    );
    assert(
      Number.isInteger(condition.maxMistakes) && condition.maxMistakes >= 0,
      `challenge ${challenge.id} invalid maxMistakes`,
    );
    assert(
      Array.isArray(challenge.sensitiveItems) &&
        challenge.sensitiveItems.length >= condition.requiredSensitiveClicks,
      `challenge ${challenge.id} has too few sensitiveItems`,
    );
    assert(
      Array.isArray(challenge.decoyItems) && challenge.decoyItems.length >= 2,
      `challenge ${challenge.id} needs at least 2 decoyItems`,
    );

    assertUniqueIds(challenge.sensitiveItems, `${challenge.id} sensitiveItems`);
    assertUniqueIds(challenge.decoyItems, `${challenge.id} decoyItems`);

    for (const item of challenge.sensitiveItems) {
      assert(dataTypes.has(item.dataType), `challenge ${challenge.id} item ${item.id} invalid dataType`);
      assert(
        sensitivities.has(item.sensitivity),
        `challenge ${challenge.id} item ${item.id} invalid sensitivity`,
      );
      assert(item.label, `challenge ${challenge.id} item ${item.id} missing label`);
      assert(item.iconHint, `challenge ${challenge.id} item ${item.id} missing iconHint`);
      assert(item.description, `challenge ${challenge.id} item ${item.id} missing description`);
    }

    for (const item of challenge.decoyItems) {
      assert(
        dataCleaningTrapTypes.has(item.trapType),
        `challenge ${challenge.id} decoy ${item.id} invalid trapType`,
      );
      assert(item.label, `challenge ${challenge.id} decoy ${item.id} missing label`);
      assert(item.iconHint, `challenge ${challenge.id} decoy ${item.id} missing iconHint`);
      assert(item.description, `challenge ${challenge.id} decoy ${item.id} missing description`);
    }
  }
}

console.log("Content validation passed.");
console.log(`cards=${cardTemplates.length}`);
console.log(`users=${users.length}`);
console.log(`buyers=${buyers.length}`);
console.log(`recipes=${recipes.length}`);
console.log(`news=${newsTemplates.length}`);
console.log(`protocolTerms=${protocolTerms.length}`);
console.log(`dayChallenges=${dayChallenges.length}`);
