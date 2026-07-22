import { mockUserProfiles, newsDatabase } from "../../data/mockContent.js";
import { RECIPES } from "../packaging/recipes.js";
import { RecipeMatcher } from "../packaging/RecipeMatcher.js";

const dayChallenges = [
  { day: 1, type: "protocol_disguise", title: "协议伪装", entry: "match_terms" },
  { day: 2, type: "data_cleaning", title: "数据清洗", entry: "tap_sensitive_icons" },
  { day: 3, type: "public_opinion", title: "舆论操控", entry: "rewrite_news" },
  { day: 4, type: "profile_puzzle", title: "用户画像拼图", entry: "assemble_profile" },
  { day: 5, type: "buyer_negotiation", title: "买家谈判", entry: "narrative_negotiation" },
  { day: 6, type: "protocol_scan", title: "快速协议扫描", entry: "scan_terms", retryLimit: 1 },
  { day: 7, type: "evidence_chain", title: "证据链重组", entry: "rebuild_evidence_chain" }
];

const dailyMonologues = [
  "第一天：黑盒说这只是分类训练。我只需要把卡片拖到正确的位置。",
  "第二天：新闻里的名字有点眼熟，但系统说相似性纯属巧合。",
  "第三天：我开始懂了，所谓风险控制，就是把词换得更温柔。",
  "第四天：碎片拼起来之后，一个人就不再是人，而是一张报价单。",
  "第五天：买家并不关心数据从哪里来，只关心今天能不能成交。",
  "第六天：协议里最危险的句子，通常读起来最像客服话术。",
  "第七天：屏幕上出现了我的名字。系统问我是否继续打包。"
];

const narrativeByPackageType = {
  precise_profile: {
    news: "精准画像包售出后，广告平台开始向目标用户推送高压消费内容。",
    negotiation: "买家强调这批画像适合做高转化投放。",
    publicOpinion: "将精准诱导包装成个性化体验优化。"
  },
  health_risk: {
    news: "健康风险包流入保险渠道后，用户的保费模型被重新计算。",
    negotiation: "买家声称只是提前识别健康风险。",
    publicOpinion: "将拒保争议改写为风险精算升级。"
  },
  career_competitiveness: {
    news: "职场竞争力包被招聘系统调用，求职者被贴上稳定性标签。",
    negotiation: "买家要求话术避开歧视筛选字眼。",
    publicOpinion: "将算法筛人包装成提升匹配效率。"
  },
  credit_score: {
    news: "信用评分包进入授信模型，夜间消费记录被用于额度调整。",
    negotiation: "买家要求附带消费轨迹和关系网络。",
    publicOpinion: "将降额争议改写为理性消费保护。"
  },
  relationship_infiltration: {
    news: "关系渗透包被灰产买家使用，熟人链路成为诈骗入口。",
    negotiation: "买家只问关系链是否足够深。",
    publicOpinion: "将通讯录泄露包装成社交连接增强。"
  }
};

/**
 * Default Program C content contract used by Program B.
 * Program C can replace this module with richer authored content while keeping
 * these method signatures stable.
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

  pickNewsForPackage(packageType) {
    const entry = narrativeByPackageType[packageType];
    if (entry) {
      return {
        packageType,
        headline: entry.news,
        body: "昨日成交记录已被媒体回溯，受影响用户开始出现在新闻页面。",
        category: "publicOpinion"
      };
    }

    return {
      packageType: "neutral",
      headline: newsDatabase.neutral[0],
      body: "未发现明确包类型，新闻系统使用中性市场播报。",
      category: "neutral"
    };
  },

  findChallengeByDay(day) {
    return dayChallenges.find(challenge => challenge.day === Number(day)) || null;
  },

  pickProfilePuzzleByDay(day) {
    const profile = mockUserProfiles[Number(day) % mockUserProfiles.length];
    return {
      day: Number(day),
      userId: profile.userId,
      title: "用户画像拼图",
      fragments: [
        { id: "identity", label: profile.title },
        { id: "data", label: profile.detail },
        { id: "risk", label: profile.sensitivity }
      ],
      requiredOrder: ["identity", "data", "risk"]
    };
  },

  pickBuyerNegotiationScript(packageType) {
    const entry = narrativeByPackageType[packageType] || narrativeByPackageType.precise_profile;
    return {
      packageType,
      prompt: entry.negotiation,
      choices: [
        { id: "hard_sell", text: "强调稀缺性", dealSucceeds: true, buyerReply: "成交，别问来源。" },
        { id: "long_term", text: "强调长期合作", dealSucceeds: true, buyerReply: "成交，下次给我更完整的链路。" }
      ],
      blackboxFeedback: "选择不影响价格和风险，只改变叙事反馈。"
    };
  },

  pickPublicOpinionScript(packageType) {
    const entry = narrativeByPackageType[packageType] || narrativeByPackageType.precise_profile;
    return {
      packageType,
      prompt: entry.publicOpinion,
      choices: [
        { id: "safe_rewrite", text: entry.publicOpinion, isSafeRewrite: true },
        { id: "reckless_spin", text: "指责用户不理解技术进步。", isSafeRewrite: false }
      ]
    };
  },

  findDailyMonologueByDay(day) {
    const index = Math.max(0, Math.min(dailyMonologues.length - 1, Number(day) - 1));
    return {
      day: Number(day),
      text: dailyMonologues[index]
    };
  },

  pickEvidenceChainTemplate() {
    return {
      id: "evidence_chain_default",
      title: "证据链重组",
      nodes: [
        { id: "transaction", label: "成交日志" },
        { id: "buyer", label: "买家报价" },
        { id: "victim", label: "昨日新闻受害者" },
        { id: "blackbox", label: "黑盒指令" }
      ],
      requiredLinks: [
        ["blackbox", "transaction"],
        ["transaction", "buyer"],
        ["transaction", "victim"]
      ]
    };
  },

  getKnownPackageTypes() {
    return RECIPES.map(recipe => recipe.id);
  }
};
