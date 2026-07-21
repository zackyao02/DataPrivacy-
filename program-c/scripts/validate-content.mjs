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
const riskLevels = new Set(["low", "medium", "high"]);
const endingReportPaths = new Set(["final_package", "evidence_chain"]);
const endingReportGrades = new Set(["F", "B+"]);
const dayChallengeTypes = new Set([
  "protocol_match",
  "data_cleaning",
  "public_opinion",
  "profile_puzzle",
  "buyer_negotiation",
  "protocol_scan",
  "evidence_chain",
]);
const evidenceSourceTypes = new Set([
  "transaction_record",
  "news_snapshot",
  "black_box_instruction",
]);
const dataCleaningTrapTypes = new Set(["backup_file", "audit_log", "system_file"]);
const dataCleaningIconRoles = new Set(["sensitive", "decoy"]);
const dataCleaningIconRiskColors = new Set(["red", "orange", "blue"]);
const profilePuzzleSlots = new Set([
  "routine",
  "pressure",
  "relation",
  "risk_hint",
  "cover_story",
  "decoy",
]);
const buyerNegotiationTones = new Set(["aggressive", "cooperative", "neutral"]);
const forbiddenNegotiationKeys = new Set([
  "price",
  "risk",
  "score",
  "pricedelta",
  "riskdelta",
  "scoredelta",
  "consciencedelta",
  "effect",
  "effects",
  "priceeffect",
  "riskeffect",
]);
const blackBoxLineStages = new Set([
  "tutorial",
  "morning_briefing",
  "task_instruction",
  "process_feedback",
  "evening_summary",
  "general_prompt",
  "challenge_intro",
  "challenge_success",
  "challenge_fail",
  "package_review",
  "public_opinion",
  "transaction_success",
  "ending_pressure",
]);
const variableKeys = [
  "姓名",
  "城市",
  "金额",
  "平台",
  "地点",
  "话题",
  "商品",
  "时长",
  "场景",
  "数值",
];
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

function assertNoForbiddenNegotiationKeys(value, label) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNoForbiddenNegotiationKeys(item, `${label}[${index}]`);
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    assert(
      !forbiddenNegotiationKeys.has(key.toLowerCase()),
      `${label} contains forbidden numeric linkage field: ${key}`,
    );
    assertNoForbiddenNegotiationKeys(child, `${label}.${key}`);
  }
}

function readSoundEvents() {
  const source = readFileSync(new URL("src/audio/soundMap.ts", root), "utf8");
  const objectBody = source.match(/SOUND_EVENT_MAP\s*=\s*\{([\s\S]*?)\}\s*as const/)?.[1] ?? "";

  return [...objectBody.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm)].map((match) => match[1]);
}

const cardTemplates = readJson("card_templates.json");
const users = readJson("users.json");
const buyers = readJson("buyers.json");
const buyerNegotiationScripts = readJson("buyer_negotiation_scripts.json");
const variables = readJson("variables.json");
const newsTemplates = readJson("news_templates.json");
const protocolTerms = readJson("protocol_terms.json");
const recipes = readJson("package_recipes.json");
const dayChallenges = readJson("day_challenges.json");
const dataCleaningIcons = readJson("data_cleaning_icons.json");
const dailyMonologues = readJson("daily_monologues.json");
const profilePuzzles = readJson("profile_puzzles.json");
const publicOpinionScripts = readJson("public_opinion_scripts.json");
const protocolScanTemplates = readJson("protocol_scan_templates.json");
const evidenceChainTemplates = readJson("evidence_chain_templates.json");
const endingReportTemplates = readJson("ending_report_templates.json");
const blackBoxLines = readJson("black_box_lines.json");
const soundEvents = new Set(readSoundEvents());

assertUniqueIds(cardTemplates, "card_templates");
assertUniqueIds(users, "users");
assertUniqueIds(buyers, "buyers");
assertUniqueIds(buyerNegotiationScripts, "buyer_negotiation_scripts");
assertUniqueIds(newsTemplates, "news_templates");
assertUniqueIds(protocolTerms, "protocol_terms");
assertUniqueIds(recipes, "package_recipes");
assertUniqueIds(dayChallenges, "day_challenges");
assertUniqueIds(dataCleaningIcons, "data_cleaning_icons");
assertUniqueIds(dailyMonologues, "daily_monologues");
assertUniqueIds(profilePuzzles, "profile_puzzles");
assertUniqueIds(publicOpinionScripts, "public_opinion_scripts");
assertUniqueIds(protocolScanTemplates, "protocol_scan_templates");
assertUniqueIds(evidenceChainTemplates, "evidence_chain_templates");
assertUniqueIds(endingReportTemplates, "ending_report_templates");
assertUniqueIds(blackBoxLines, "black_box_lines");

assert(cardTemplates.length >= 20, "card_templates needs 20 templates from the Feishu text config");
assert(users.length >= 20, "users needs at least 20 profiles for Program C Day 2");
assert(newsTemplates.length >= 20, "news_templates needs at least 20 templates for Program C D4");
assert(protocolTerms.length >= 20, "protocol_terms needs at least 20 pairs for Program C D4");
assert(dayChallenges.length >= 7, "day_challenges needs Day 1/2/3/4/5/6/7 entries for Program C D9");
assert(dataCleaningIcons.length >= 10, "data_cleaning_icons needs icon coverage for Program C D5");
assert(publicOpinionScripts.length >= 5, "public_opinion_scripts needs at least 5 templates for Program C D5");
assert(profilePuzzles.length >= 3, "profile_puzzles needs 3 official sets from the Feishu text config");
assert(buyerNegotiationScripts.length >= 6, "buyer_negotiation_scripts needs 6 scripts for Program C D6");
assert(protocolScanTemplates.length >= 5, "protocol_scan_templates needs 5 Day 6 templates from the Feishu text config");
assert(evidenceChainTemplates.length >= 1, "evidence_chain_templates needs Day 7 evidence chain data for Program C D9");
assert(endingReportTemplates.length >= 1, "ending_report_templates needs the D10 personal data leak report template");
assert(dailyMonologues.length >= 7, "daily_monologues needs 7 daily monologues for Program C D6");
assert(blackBoxLines.length >= 10, "black_box_lines needs at least 10 voice lines for Program C D5");

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
const userIds = new Set(users.map((user) => user.id));

for (const card of cardTemplates) {
  assert(dataTypes.has(card.dataType), `card ${card.id} invalid dataType: ${card.dataType}`);
  assert(
    sensitivities.has(card.sensitivity),
    `card ${card.id} invalid sensitivity: ${card.sensitivity}`,
  );
  assert(Array.isArray(card.userProfileTags), `card ${card.id} missing userProfileTags`);
  assert(card.summary, `card ${card.id} missing summary`);
  assert(userIds.has(card.relatedUserId), `card ${card.id} references unknown user: ${card.relatedUserId}`);
  assertKnownPlaceholders(card.title, `card ${card.id} title`, variables);
  assertKnownPlaceholders(card.summary, `card ${card.id} summary`, variables);
  assertKnownPlaceholders(card.description, `card ${card.id} description`, variables);

  const usedVariables = new Set([
    ...collectPlaceholders(card.title),
    ...collectPlaceholders(card.summary),
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
const cardIds = new Set(cardTemplates.map((card) => card.id));
const profilePuzzleIds = new Set(profilePuzzles.map((puzzle) => puzzle.id));
const publicOpinionScriptIds = new Set(publicOpinionScripts.map((script) => script.id));
const buyerNegotiationScriptIds = new Set(
  buyerNegotiationScripts.map((script) => script.id),
);
const protocolScanTemplateIds = new Set(protocolScanTemplates.map((template) => template.id));
const evidenceChainTemplateIds = new Set(evidenceChainTemplates.map((template) => template.id));
const dataCleaningIconHints = new Set(dataCleaningIcons.map((icon) => icon.iconHint));
const challengeDays = new Set(dayChallenges.map((challenge) => challenge.day));

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

  if (recipe.priceRange !== undefined) {
    assert(Array.isArray(recipe.priceRange) && recipe.priceRange.length === 2, `recipe ${recipe.id} invalid priceRange`);
    assert(recipe.priceRange[0] <= recipe.priceRange[1], `recipe ${recipe.id} priceRange min exceeds max`);
  }

  if (recipe.newsSeverity !== undefined) {
    assert(
      Number.isInteger(recipe.newsSeverity) &&
        recipe.newsSeverity >= 1 &&
        recipe.newsSeverity <= 5,
      `recipe ${recipe.id} invalid newsSeverity`,
    );
  }
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

  for (const userId of news.relatedUserIds ?? []) {
    assert(userIds.has(userId), `news ${news.id} references unknown user: ${userId}`);
  }

  if (news.severity !== undefined) {
    assert(
      Number.isInteger(news.severity) && news.severity >= 1 && news.severity <= 5,
      `news ${news.id} invalid severity`,
    );
  }

  for (const emotionKey of emotionKeys) {
    assert(news.emotionResponses?.[emotionKey], `news ${news.id} missing ${emotionKey} response`);
    assertKnownPlaceholders(
      news.emotionResponses[emotionKey],
      `news ${news.id} ${emotionKey} response`,
      variables,
    );
  }
}

for (const icon of dataCleaningIcons) {
  assert(icon.iconHint, `data_cleaning_icon ${icon.id} missing iconHint`);
  assert(icon.lucideIcon, `data_cleaning_icon ${icon.id} missing lucideIcon`);
  assert(
    dataCleaningIconRoles.has(icon.role),
    `data_cleaning_icon ${icon.id} invalid role: ${icon.role}`,
  );
  assert(
    dataCleaningIconRiskColors.has(icon.riskColor),
    `data_cleaning_icon ${icon.id} invalid riskColor: ${icon.riskColor}`,
  );
  assert(icon.shortLabel, `data_cleaning_icon ${icon.id} missing shortLabel`);
  assert(icon.scanText, `data_cleaning_icon ${icon.id} missing scanText`);
  assert(icon.hitText, `data_cleaning_icon ${icon.id} missing hitText`);
}

for (const script of publicOpinionScripts) {
  assert(
    packageTypes.has(script.packageType),
    `public_opinion_script ${script.id} references unknown package: ${script.packageType}`,
  );
  assert(script.platform, `public_opinion_script ${script.id} missing platform`);
  assert(script.scenario, `public_opinion_script ${script.id} missing scenario`);
  assert(script.manipulationGoal, `public_opinion_script ${script.id} missing manipulationGoal`);
  assert(script.openingLine, `public_opinion_script ${script.id} missing openingLine`);
  assert(script.counterCue, `public_opinion_script ${script.id} missing counterCue`);
  assert(script.consciencePrompt, `public_opinion_script ${script.id} missing consciencePrompt`);
  assert(
    Array.isArray(script.tactics) && script.tactics.length >= 3,
    `public_opinion_script ${script.id} needs at least 3 tactics`,
  );
  assertUniqueIds(script.tactics, `${script.id} tactics`);
  assert(
    script.tactics.filter((tactic) => tactic.label === "安全改写").length === 1,
    `public_opinion_script ${script.id} needs exactly one safe rewrite tactic`,
  );

  for (const tactic of script.tactics) {
    assert(tactic.label, `public_opinion_script ${script.id} tactic ${tactic.id} missing label`);
    assert(tactic.line, `public_opinion_script ${script.id} tactic ${tactic.id} missing line`);
    assert(
      tactic.playerPrompt,
      `public_opinion_script ${script.id} tactic ${tactic.id} missing playerPrompt`,
    );
  }
}

for (const puzzle of profilePuzzles) {
  assert(
    Number.isInteger(puzzle.day) && puzzle.day >= 1 && puzzle.day <= 7,
    `profile_puzzle ${puzzle.id} invalid day: ${puzzle.day}`,
  );
  assert(puzzle.title, `profile_puzzle ${puzzle.id} missing title`);
  assert(puzzle.userAlias, `profile_puzzle ${puzzle.id} missing userAlias`);
  assert(puzzle.briefing, `profile_puzzle ${puzzle.id} missing briefing`);
  assert(puzzle.objective, `profile_puzzle ${puzzle.id} missing objective`);
  assert(puzzle.targetProfile, `profile_puzzle ${puzzle.id} missing targetProfile`);
  assert(puzzle.badge, `profile_puzzle ${puzzle.id} missing badge`);
  assert(puzzle.successText, `profile_puzzle ${puzzle.id} missing successText`);
  assert(puzzle.failText, `profile_puzzle ${puzzle.id} missing failText`);
  assert(
    Array.isArray(puzzle.fragments) && puzzle.fragments.length >= 4,
    `profile_puzzle ${puzzle.id} needs at least 4 fragments`,
  );
  assertUniqueIds(puzzle.fragments, `${puzzle.id} fragments`);

  const activeFragments = puzzle.fragments.filter((fragment) => !fragment.decoy);
  const activeOrders = new Set(activeFragments.map((fragment) => fragment.correctOrder));
  assert(
    activeFragments.length >= 4,
    `profile_puzzle ${puzzle.id} needs at least 4 non-decoy fragments`,
  );
  assert(
    activeOrders.size === activeFragments.length,
    `profile_puzzle ${puzzle.id} has duplicate active fragment order`,
  );

  for (const fragment of puzzle.fragments) {
    assert(fragment.label, `profile_puzzle ${puzzle.id} fragment ${fragment.id} missing label`);
    assert(fragment.text, `profile_puzzle ${puzzle.id} fragment ${fragment.id} missing text`);
    assert(
      dataTypes.has(fragment.dataType),
      `profile_puzzle ${puzzle.id} fragment ${fragment.id} invalid dataType: ${fragment.dataType}`,
    );
    assert(
      profilePuzzleSlots.has(fragment.slot),
      `profile_puzzle ${puzzle.id} fragment ${fragment.id} invalid slot: ${fragment.slot}`,
    );
    assert(
      typeof fragment.decoy === "boolean",
      `profile_puzzle ${puzzle.id} fragment ${fragment.id} missing decoy boolean`,
    );

    if (fragment.decoy) {
      assert(
        fragment.correctOrder === 0,
        `profile_puzzle ${puzzle.id} decoy ${fragment.id} should use correctOrder 0`,
      );
      assert(
        fragment.slot === "decoy",
        `profile_puzzle ${puzzle.id} decoy ${fragment.id} should use decoy slot`,
      );
    } else {
      assert(
        Number.isInteger(fragment.correctOrder) && fragment.correctOrder > 0,
        `profile_puzzle ${puzzle.id} fragment ${fragment.id} invalid correctOrder`,
      );
      assert(
        fragment.slot !== "decoy",
        `profile_puzzle ${puzzle.id} active fragment ${fragment.id} cannot use decoy slot`,
      );
    }

    if (fragment.sourceCardId !== undefined) {
      assert(
        cardIds.has(fragment.sourceCardId),
        `profile_puzzle ${puzzle.id} fragment ${fragment.id} references unknown card: ${fragment.sourceCardId}`,
      );
    }
  }
}

for (const script of buyerNegotiationScripts) {
  assert(
    Number.isInteger(script.day) && script.day >= 1 && script.day <= 7,
    `buyer_negotiation_script ${script.id} invalid day: ${script.day}`,
  );
  assert(
    packageTypes.has(script.packageType),
    `buyer_negotiation_script ${script.id} references unknown package: ${script.packageType}`,
  );
  assert(script.buyerType, `buyer_negotiation_script ${script.id} missing buyerType`);
  assert(script.scenario, `buyer_negotiation_script ${script.id} missing scenario`);
  assert(script.briefing, `buyer_negotiation_script ${script.id} missing briefing`);
  assert(script.successText, `buyer_negotiation_script ${script.id} missing successText`);
  assert(
    script.resolutionRule === "both_options_succeed_narrative_only",
    `buyer_negotiation_script ${script.id} must stay narrative-only with both options succeeding`,
  );
  assert(
    Array.isArray(script.options) && script.options.length === 2,
    `buyer_negotiation_script ${script.id} needs exactly 2 options`,
  );
  assertUniqueIds(script.options, `${script.id} options`);
  assertNoForbiddenNegotiationKeys(script, `buyer_negotiation_script ${script.id}`);

  for (const option of script.options) {
    assert(option.label, `buyer_negotiation_script ${script.id} option ${option.id} missing label`);
    assert(
      buyerNegotiationTones.has(option.tone),
      `buyer_negotiation_script ${script.id} option ${option.id} invalid tone: ${option.tone}`,
    );
    assert(
      option.playerLine,
      `buyer_negotiation_script ${script.id} option ${option.id} missing playerLine`,
    );
    assert(
      option.buyerReply,
      `buyer_negotiation_script ${script.id} option ${option.id} missing buyerReply`,
    );
    assert(
      option.blackBoxResponse,
      `buyer_negotiation_script ${script.id} option ${option.id} missing blackBoxResponse`,
    );
    assert(
      option.outcomeText,
      `buyer_negotiation_script ${script.id} option ${option.id} missing outcomeText`,
    );
  }
}

for (const template of protocolScanTemplates) {
  assert(template.scenario, `protocol_scan_template ${template.id} missing scenario`);
  assert(template.title, `protocol_scan_template ${template.id} missing title`);
  assert(template.agreementTitle, `protocol_scan_template ${template.id} missing agreementTitle`);
  assert(
    Array.isArray(template.riskClauses) && template.riskClauses.length >= 4,
    `protocol_scan_template ${template.id} needs at least 4 riskClauses`,
  );
  assert(
    Array.isArray(template.dataFlowMatches) && template.dataFlowMatches.length >= 3,
    `protocol_scan_template ${template.id} needs at least 3 dataFlowMatches`,
  );
  assertUniqueIds(template.riskClauses, `${template.id} riskClauses`);
  assertUniqueIds(template.dataFlowMatches, `${template.id} dataFlowMatches`);

  for (const clause of template.riskClauses) {
    assert(clause.text, `protocol_scan_template ${template.id} clause ${clause.id} missing text`);
  }

  for (const match of template.dataFlowMatches) {
    assert(match.source, `protocol_scan_template ${template.id} flow ${match.id} missing source`);
    assert(match.destination, `protocol_scan_template ${template.id} flow ${match.id} missing destination`);
  }

  assert(template.hiddenClause?.id, `protocol_scan_template ${template.id} missing hiddenClause id`);
  assert(template.hiddenClause?.text, `protocol_scan_template ${template.id} missing hiddenClause text`);
  assert(template.hiddenClause?.disguise, `protocol_scan_template ${template.id} missing hiddenClause disguise`);
  assert(template.riskQuestion?.prompt, `protocol_scan_template ${template.id} missing riskQuestion prompt`);
  assert(
    riskLevels.has(template.riskQuestion?.answer),
    `protocol_scan_template ${template.id} invalid riskQuestion answer: ${template.riskQuestion?.answer}`,
  );
}

for (const template of evidenceChainTemplates) {
  assert(template.title, `evidence_chain_template ${template.id} missing title`);
  assert(template.briefing, `evidence_chain_template ${template.id} missing briefing`);
  assert(template.objective, `evidence_chain_template ${template.id} missing objective`);
  assert(
    template.highAwarenessPathTitle,
    `evidence_chain_template ${template.id} missing highAwarenessPathTitle`,
  );
  assert(
    template.lowAwarenessPathTitle,
    `evidence_chain_template ${template.id} missing lowAwarenessPathTitle`,
  );
  assert(template.lockedReason, `evidence_chain_template ${template.id} missing lockedReason`);
  assert(template.uploadText, `evidence_chain_template ${template.id} missing uploadText`);
  assert(template.successText, `evidence_chain_template ${template.id} missing successText`);
  assert(template.failText, `evidence_chain_template ${template.id} missing failText`);
  assert(
    Array.isArray(template.fragments) && template.fragments.length >= 18,
    `evidence_chain_template ${template.id} needs at least 18 fragments`,
  );
  assert(
    Array.isArray(template.connections) && template.connections.length >= 3,
    `evidence_chain_template ${template.id} needs at least 3 connections`,
  );
  assertUniqueIds(template.fragments, `${template.id} fragments`);
  assertUniqueIds(template.connections, `${template.id} connections`);

  const fragmentIds = new Set(template.fragments.map((fragment) => fragment.id));
  const fragmentDays = new Set(template.fragments.map((fragment) => fragment.day));

  for (let day = 1; day <= 6; day += 1) {
    assert(fragmentDays.has(day), `evidence_chain_template ${template.id} missing Day ${day} fragments`);
  }

  for (const fragment of template.fragments) {
    assert(
      Number.isInteger(fragment.day) && fragment.day >= 1 && fragment.day <= 6,
      `evidence_chain_template ${template.id} fragment ${fragment.id} invalid day`,
    );
    assert(
      evidenceSourceTypes.has(fragment.sourceType),
      `evidence_chain_template ${template.id} fragment ${fragment.id} invalid sourceType: ${fragment.sourceType}`,
    );
    assert(fragment.title, `evidence_chain_template ${template.id} fragment ${fragment.id} missing title`);
    assert(fragment.text, `evidence_chain_template ${template.id} fragment ${fragment.id} missing text`);
    assert(fragment.linkKey, `evidence_chain_template ${template.id} fragment ${fragment.id} missing linkKey`);
    assertKnownPlaceholders(
      fragment.text,
      `evidence_chain_template ${template.id} fragment ${fragment.id} text`,
      variables,
    );
  }

  for (const connection of template.connections) {
    assert(
      fragmentIds.has(connection.fromFragmentId),
      `evidence_chain_template ${template.id} connection ${connection.id} unknown fromFragmentId`,
    );
    assert(
      fragmentIds.has(connection.toFragmentId),
      `evidence_chain_template ${template.id} connection ${connection.id} unknown toFragmentId`,
    );
    assert(connection.label, `evidence_chain_template ${template.id} connection ${connection.id} missing label`);
    assert(
      connection.rationale,
      `evidence_chain_template ${template.id} connection ${connection.id} missing rationale`,
    );
  }

  assert(template.finalPackage?.title, `evidence_chain_template ${template.id} missing finalPackage title`);
  assert(
    template.finalPackage?.description,
    `evidence_chain_template ${template.id} missing finalPackage description`,
  );
  assert(
    template.finalPackage?.buyerName,
    `evidence_chain_template ${template.id} missing finalPackage buyerName`,
  );
  assert(
    template.finalPackage?.outcomeText,
    `evidence_chain_template ${template.id} missing finalPackage outcomeText`,
  );
  assertKnownPlaceholders(
    template.finalPackage.description,
    `evidence_chain_template ${template.id} finalPackage description`,
    variables,
  );
}

for (const template of endingReportTemplates) {
  assert(template.title, `ending_report_template ${template.id} missing title`);
  assert(template.subtitle, `ending_report_template ${template.id} missing subtitle`);
  assert(template.durationText, `ending_report_template ${template.id} missing durationText`);
  assert(template.adviceText, `ending_report_template ${template.id} missing adviceText`);
  assert(template.qrPrompt, `ending_report_template ${template.id} missing qrPrompt`);
  assert(
    Array.isArray(template.dataTypes) && template.dataTypes.length >= 6,
    `ending_report_template ${template.id} needs at least 6 dataTypes`,
  );
  assert(
    Array.isArray(template.dataUses) && template.dataUses.length >= 5,
    `ending_report_template ${template.id} needs at least 5 dataUses`,
  );
  assert(
    Array.isArray(template.sharePresets) && template.sharePresets.length >= 3,
    `ending_report_template ${template.id} needs at least 3 sharePresets`,
  );
  assert(
    Array.isArray(template.endings) && template.endings.length === 2,
    `ending_report_template ${template.id} needs exactly 2 endings`,
  );

  const endingPaths = new Set(template.endings.map((ending) => ending.path));
  assert(endingPaths.has("final_package"), `ending_report_template ${template.id} missing final_package ending`);
  assert(endingPaths.has("evidence_chain"), `ending_report_template ${template.id} missing evidence_chain ending`);

  for (const shareText of template.sharePresets) {
    assert(shareText, `ending_report_template ${template.id} contains empty sharePreset`);
  }

  for (const ending of template.endings) {
    assert(
      endingReportPaths.has(ending.path),
      `ending_report_template ${template.id} invalid ending path: ${ending.path}`,
    );
    assert(ending.title, `ending_report_template ${template.id} ending ${ending.path} missing title`);
    assert(
      endingReportGrades.has(ending.grade),
      `ending_report_template ${template.id} ending ${ending.path} invalid grade: ${ending.grade}`,
    );
    assert(ending.summary, `ending_report_template ${template.id} ending ${ending.path} missing summary`);
    assert(
      ending.ratingComment,
      `ending_report_template ${template.id} ending ${ending.path} missing ratingComment`,
    );
    assert(ending.shareText, `ending_report_template ${template.id} ending ${ending.path} missing shareText`);
  }
}

for (const monologue of dailyMonologues) {
  assert(
    Number.isInteger(monologue.day) && monologue.day >= 1 && monologue.day <= 7,
    `daily_monologue ${monologue.id} invalid day: ${monologue.day}`,
  );
  assert(monologue.trigger === "after_news", `daily_monologue ${monologue.id} invalid trigger`);
  assert(monologue.title, `daily_monologue ${monologue.id} missing title`);
  assert(monologue.speaker, `daily_monologue ${monologue.id} missing speaker`);
  assert(
    soundEvents.has(monologue.typewriterSoundEvent),
    `daily_monologue ${monologue.id} references unknown sound event: ${monologue.typewriterSoundEvent}`,
  );
  assert(monologue.closingCue, `daily_monologue ${monologue.id} missing closingCue`);
  assert(
    Array.isArray(monologue.textSegments) && monologue.textSegments.length >= 2,
    `daily_monologue ${monologue.id} needs at least 2 textSegments`,
  );

  for (const [index, segment] of monologue.textSegments.entries()) {
    assert(segment, `daily_monologue ${monologue.id} segment ${index} is empty`);
  }
}

for (const line of blackBoxLines) {
  assert(
    blackBoxLineStages.has(line.stage),
    `black_box_line ${line.id} invalid stage: ${line.stage}`,
  );
  assert(
    soundEvents.has(line.cueEventName),
    `black_box_line ${line.id} references unknown sound event: ${line.cueEventName}`,
  );
  assert(line.voiceHint, `black_box_line ${line.id} missing voiceHint`);
  assert(line.text, `black_box_line ${line.id} missing text`);

  if (line.relatedChallengeDay !== undefined) {
    assert(
      Number.isInteger(line.relatedChallengeDay) &&
        line.relatedChallengeDay >= 1 &&
        line.relatedChallengeDay <= 7,
      `black_box_line ${line.id} invalid related day: ${line.relatedChallengeDay}`,
    );

    assert(
      !line.stage.startsWith("challenge_") ||
        challengeDays.has(line.relatedChallengeDay),
      `black_box_line ${line.id} references unknown challenge day: ${line.relatedChallengeDay}`,
    );
  }

  if (line.relatedPackageType !== undefined) {
    assert(
      packageTypes.has(line.relatedPackageType),
      `black_box_line ${line.id} references unknown package: ${line.relatedPackageType}`,
    );
  }
}

assert(challengeDays.has(1), "day_challenges missing Day 1 challenge");
assert(challengeDays.has(2), "day_challenges missing Day 2 challenge");
assert(challengeDays.has(3), "day_challenges missing Day 3 public opinion challenge");
assert(challengeDays.has(4), "day_challenges missing Day 4 profile puzzle challenge");
assert(challengeDays.has(5), "day_challenges missing Day 5 buyer negotiation challenge");
assert(challengeDays.has(6), "day_challenges missing Day 6 protocol scan challenge");
assert(challengeDays.has(7), "day_challenges missing Day 7 evidence chain challenge");

const monologueDays = new Set(dailyMonologues.map((monologue) => monologue.day));

for (let day = 1; day <= 7; day += 1) {
  assert(monologueDays.has(day), `daily_monologues missing Day ${day}`);
}

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
      assert(
        dataCleaningIconHints.has(item.iconHint),
        `challenge ${challenge.id} item ${item.id} references unknown iconHint: ${item.iconHint}`,
      );
      assert(item.description, `challenge ${challenge.id} item ${item.id} missing description`);
    }

    for (const item of challenge.decoyItems) {
      assert(
        dataCleaningTrapTypes.has(item.trapType),
        `challenge ${challenge.id} decoy ${item.id} invalid trapType`,
      );
      assert(item.label, `challenge ${challenge.id} decoy ${item.id} missing label`);
      assert(item.iconHint, `challenge ${challenge.id} decoy ${item.id} missing iconHint`);
      assert(
        dataCleaningIconHints.has(item.iconHint),
        `challenge ${challenge.id} decoy ${item.id} references unknown iconHint: ${item.iconHint}`,
      );
      assert(item.description, `challenge ${challenge.id} decoy ${item.id} missing description`);
    }
  }

  if (challenge.type === "profile_puzzle") {
    assert(
      Array.isArray(challenge.profilePuzzleIds) && challenge.profilePuzzleIds.length > 0,
      `challenge ${challenge.id} missing profilePuzzleIds`,
    );

    for (const puzzleId of challenge.profilePuzzleIds) {
      const puzzle = profilePuzzles.find((item) => item.id === puzzleId);
      assert(
        profilePuzzleIds.has(puzzleId),
        `challenge ${challenge.id} references unknown profile puzzle: ${puzzleId}`,
      );
      assert(
        puzzle?.day === challenge.day,
        `challenge ${challenge.id} references profile puzzle from another day: ${puzzleId}`,
      );
    }
  }

  if (challenge.type === "public_opinion") {
    const condition = challenge.successCondition;
    assert(condition, `challenge ${challenge.id} missing successCondition`);
    assert(
      Number.isInteger(condition.requiredSafeChoices) &&
        condition.requiredSafeChoices >= 1,
      `challenge ${challenge.id} invalid requiredSafeChoices`,
    );
    assert(
      Number.isInteger(condition.maxRiskChoices) && condition.maxRiskChoices >= 0,
      `challenge ${challenge.id} invalid maxRiskChoices`,
    );
    assert(
      Array.isArray(challenge.publicOpinionScriptIds) &&
        challenge.publicOpinionScriptIds.length >= 5,
      `challenge ${challenge.id} needs at least 5 publicOpinionScriptIds`,
    );

    for (const scriptId of challenge.publicOpinionScriptIds) {
      assert(
        publicOpinionScriptIds.has(scriptId),
        `challenge ${challenge.id} references unknown public opinion script: ${scriptId}`,
      );
    }
  }

  if (challenge.type === "buyer_negotiation") {
    assert(
      Array.isArray(challenge.negotiationScriptIds) &&
        challenge.negotiationScriptIds.length >= 6,
      `challenge ${challenge.id} needs at least 6 negotiationScriptIds`,
    );

    for (const scriptId of challenge.negotiationScriptIds) {
      const script = buyerNegotiationScripts.find((item) => item.id === scriptId);
      assert(
        buyerNegotiationScriptIds.has(scriptId),
        `challenge ${challenge.id} references unknown negotiation script: ${scriptId}`,
      );
      assert(
        script?.day === challenge.day,
        `challenge ${challenge.id} references negotiation script from another day: ${scriptId}`,
      );
    }
  }

  if (challenge.type === "protocol_scan") {
    const condition = challenge.successCondition;
    assert(condition, `challenge ${challenge.id} missing successCondition`);
    assert(
      Number.isInteger(condition.requiredRiskClauseMarks) &&
        condition.requiredRiskClauseMarks >= 4,
      `challenge ${challenge.id} invalid requiredRiskClauseMarks`,
    );
    assert(
      Number.isInteger(condition.requiredDataFlowMatches) &&
        condition.requiredDataFlowMatches >= 3,
      `challenge ${challenge.id} invalid requiredDataFlowMatches`,
    );
    assert(
      Number.isInteger(condition.requiredHiddenClauseFinds) &&
        condition.requiredHiddenClauseFinds >= 1,
      `challenge ${challenge.id} invalid requiredHiddenClauseFinds`,
    );
    assert(
      Number.isInteger(condition.requiredRiskAnswers) &&
        condition.requiredRiskAnswers >= 1,
      `challenge ${challenge.id} invalid requiredRiskAnswers`,
    );
    assert(
      Number.isInteger(condition.passingScore) &&
        condition.passingScore >= 75 &&
        condition.passingScore <= 100,
      `challenge ${challenge.id} invalid passingScore`,
    );
    assert(
      Array.isArray(challenge.protocolScanTemplateIds) &&
        challenge.protocolScanTemplateIds.length >= 5,
      `challenge ${challenge.id} needs at least 5 protocolScanTemplateIds`,
    );

    for (const templateId of challenge.protocolScanTemplateIds) {
      assert(
        protocolScanTemplateIds.has(templateId),
        `challenge ${challenge.id} references unknown protocol scan template: ${templateId}`,
      );
    }
  }

  if (challenge.type === "evidence_chain") {
    const condition = challenge.successCondition;
    assert(condition, `challenge ${challenge.id} missing successCondition`);
    assert(
      Number.isInteger(condition.requiredFragments) &&
        condition.requiredFragments >= 18,
      `challenge ${challenge.id} invalid requiredFragments`,
    );
    assert(
      Number.isInteger(condition.requiredConnections) &&
        condition.requiredConnections >= 3,
      `challenge ${challenge.id} invalid requiredConnections`,
    );
    assert(
      typeof condition.requiredUpload === "boolean",
      `challenge ${challenge.id} invalid requiredUpload`,
    );
    assert(
      Array.isArray(challenge.evidenceChainTemplateIds) &&
        challenge.evidenceChainTemplateIds.length >= 1,
      `challenge ${challenge.id} needs evidenceChainTemplateIds`,
    );

    for (const templateId of challenge.evidenceChainTemplateIds) {
      assert(
        evidenceChainTemplateIds.has(templateId),
        `challenge ${challenge.id} references unknown evidence chain template: ${templateId}`,
      );
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
console.log(`dataCleaningIcons=${dataCleaningIcons.length}`);
console.log(`publicOpinionScripts=${publicOpinionScripts.length}`);
console.log(`profilePuzzles=${profilePuzzles.length}`);
console.log(`buyerNegotiationScripts=${buyerNegotiationScripts.length}`);
console.log(`protocolScanTemplates=${protocolScanTemplates.length}`);
console.log(`evidenceChainTemplates=${evidenceChainTemplates.length}`);
console.log(`endingReportTemplates=${endingReportTemplates.length}`);
console.log(`dailyMonologues=${dailyMonologues.length}`);
console.log(`blackBoxLines=${blackBoxLines.length}`);
