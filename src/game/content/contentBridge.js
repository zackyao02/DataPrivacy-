import {
  badges,
  blackboxDialogues,
  buyerNegotiationLines,
  challengeConfigs,
  dataCleaningConfig,
  dailyMonologues,
  emotionChoices,
  evidenceChainTemplate,
  newsTemplates,
  packageConfigs,
  profilePuzzles,
  protocolScanTemplates,
  protocolTermPairs,
  publicOpinionScripts,
  userProfiles
} from "../../data/textConfig.js";
import { RECIPES } from "../packaging/recipes.js";
import { RecipeMatcher } from "../packaging/RecipeMatcher.js";

/**
 * Program C content contract consumed by Program B.
 * This bridge keeps authored text/config separate from state-machine logic.
 */
export const content = {
  findPackagePreviews(selectedCardIds, options = {}) {
    const uniqueCardIds = [...new Set(selectedCardIds)];
    if (uniqueCardIds.length !== selectedCardIds.length) {
      return {
        ok: false,
        code: "DUPLICATE_CARD",
        message: "selectedCardIds must be unique.",
        previews: []
      };
    }

    if (uniqueCardIds.length > 3) {
      return {
        ok: false,
        code: "TOO_MANY_CARDS",
        message: "A package preview can use at most 3 cards.",
        previews: []
      };
    }

    const cards = options.cards || [];
    if (cards.length !== uniqueCardIds.length) {
      return {
        ok: true,
        ready: false,
        previews: [],
        selectedCardIds: uniqueCardIds
      };
    }

    const match = RecipeMatcher.match(cards, options.preferredPackageType || null);
    const recipes = match.ambiguous ? match.candidates : match.recipe ? [match.recipe] : [];
    const previews = recipes.map(recipe => ({
      packageType: recipe.id,
      recipeId: recipe.id,
      name: recipe.name,
      description: recipe.description,
      requiredTypes: recipe.requiredTypes,
      buyerType: recipe.buyerType,
      basePrice: recipe.basePrice,
      priceRange: recipe.priceRange,
      newsSeverity: recipe.newsSeverity,
      dataUse: recipe.dataUse,
      selectedCardIds: uniqueCardIds
    }));

    return {
      ok: true,
      ready: uniqueCardIds.length === 3 && previews.length > 0,
      ambiguous: match.ambiguous,
      previews,
      selectedCardIds: uniqueCardIds
    };
  },

  pickNewsForPackage(packageType, options = {}) {
    const templates = newsTemplates[packageType] || [];
    if (!templates.length) {
      return {
        packageType: "neutral",
        headline: "内部播报：暂无外部新闻回溯",
        body: "昨日未形成可追踪的数据滥用事件。黑盒提醒：沉默不代表无害，只代表尚未曝光。",
        category: "neutral"
      };
    }

    const txUserIds = new Set((options.transactions || []).flatMap(tx => tx.userIds || tx.user_ids || []));
    const preferred = templates.find(template => template.userIds?.some(userId => txUserIds.has(userId)));
    const template = preferred || pick(options.rng, templates) || templates[0];
    const profile = findProfileForTemplate(template, txUserIds);

    return {
      id: template.id,
      packageType,
      headline: fillVariables(template.headline, profile),
      body: fillVariables(template.body, profile),
      category: "dailyNews",
      userIds: template.userIds || [],
      severity: packageConfigs[packageType]?.newsSeverity || 1
    };
  },

  findChallengeByDay(day) {
    const challenge = challengeConfigs.find(item => item.day === Number(day));
    if (!challenge) return null;

    return {
      ...challenge,
      badge: badges.find(badge => badge.id === challenge.badgeId) || null,
      terms: challenge.day === 1 ? protocolTermPairs : undefined,
      cleaning: challenge.day === 2 ? dataCleaningConfig : undefined,
      publicOpinionScripts: challenge.day === 3 ? publicOpinionScripts : undefined,
      profilePuzzles: challenge.day === 4 ? profilePuzzles : undefined,
      negotiationLines: challenge.day === 5 ? buyerNegotiationLines : undefined,
      protocolScans: challenge.day === 6 ? protocolScanTemplates : undefined,
      evidenceChain: challenge.day === 7 ? evidenceChainTemplate : undefined
    };
  },

  pickProfilePuzzleByDay(day, options = {}) {
    const available = profilePuzzles.filter(puzzle => puzzle.day === Number(day));
    const puzzle = pick(options.rng, available) || available[0] || profilePuzzles[0];
    return puzzle ? { ...puzzle, fragments: [...puzzle.fragments] } : null;
  },

  pickBuyerNegotiationScript(packageType) {
    const script = buyerNegotiationLines.find(item => item.packageType === packageType)
      || buyerNegotiationLines.find(item => item.packageType === "precise_profile");

    return {
      packageType,
      prompt: script.prompt,
      choices: script.choices.map(choice => ({
        ...choice,
        dealSucceeds: true
      })),
      blackboxFeedback: "规则保持纯叙事：两项选择都成交，不接价格/风险数值联动。"
    };
  },

  pickPublicOpinionScript(packageType) {
    return publicOpinionScripts.find(script => script.packageType === packageType)
      || publicOpinionScripts[0];
  },

  findDailyMonologueByDay(day) {
    const monologue = dailyMonologues[Number(day)];
    if (!monologue) return null;
    return { day: Number(day), ...monologue };
  },

  findBlackboxDialogueByDay(day, route = null) {
    const dialogue = blackboxDialogues[Number(day)];
    if (!dialogue) return null;
    if (Number(day) === 7) {
      return {
        day: 7,
        briefing: route === "evidence_chain" ? dialogue.highBriefing : dialogue.lowBriefing,
        nagging: blackboxDialogues.nagging
      };
    }
    return { day: Number(day), ...dialogue, nagging: blackboxDialogues.nagging };
  },

  findEmotionChoices() {
    return emotionChoices;
  },

  pickProtocolScanTemplate(options = {}) {
    return pick(options.rng, protocolScanTemplates) || protocolScanTemplates[0];
  },

  pickEvidenceChainTemplate() {
    return {
      ...evidenceChainTemplate,
      evidenceFragments: [...evidenceChainTemplate.evidenceFragments],
      buyerNetwork: [...evidenceChainTemplate.buyerNetwork],
      requiredLinks: evidenceChainTemplate.requiredLinks.map(link => [...link])
    };
  },

  getKnownPackageTypes() {
    return RECIPES.map(recipe => recipe.id);
  }
};

function pick(rng, items) {
  if (!items || items.length === 0) return null;
  if (rng && typeof rng.pick === "function") return rng.pick(items);
  return items[0];
}

function findProfileForTemplate(template, txUserIds) {
  const candidateId = template.userIds?.find(userId => txUserIds.has(userId)) || template.userIds?.[0];
  return userProfiles.find(profile => profile.userId === candidateId) || userProfiles[0];
}

function fillVariables(text, profile) {
  return text
    .replaceAll("{城市}", profile.city || "临江市")
    .replaceAll("{姓名}", profile.name || "某用户")
    .replaceAll("{平台}", "星聊");
}
