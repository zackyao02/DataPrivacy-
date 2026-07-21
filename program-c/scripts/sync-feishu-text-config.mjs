import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url);
const repoRoot = new URL("..", root);
const dataDir = new URL("data/", root);
const defaultMarkdownPath = join(
  decodeURIComponent(repoRoot.pathname).replace(/^\/([A-Za-z]:)/, "$1"),
  "..",
  "feishu_text_config_20260721.md",
);
const markdownPath = process.env.FEISHU_TEXT_CONFIG_MD ?? defaultMarkdownPath;

if (!existsSync(markdownPath)) {
  throw new Error(
    `Missing Feishu text config markdown. Set FEISHU_TEXT_CONFIG_MD or create ${markdownPath}`,
  );
}

const markdown = readFileSync(markdownPath, "utf8");
const variableKeys = ["姓名", "城市", "金额", "平台", "地点", "话题", "商品", "时长", "场景", "数值"];
const cityPool = ["临江市", "云州市", "北岗市", "南汀市", "西岭市"];
const packageTypeByName = {
  精准画像包: "precise_profile",
  健康风险评估包: "health_risk",
  职场竞争力包: "career_competitiveness",
  信用评分包: "credit_score",
  关系图谱包: "relationship_infiltration",
};
const packageNameByNewsPrefix = {
  AD: "精准画像包",
  HE: "健康风险评估包",
  JO: "职场竞争力包",
  CR: "信用评分包",
  RE: "关系图谱包",
};
const dataTypeByCardPrefix = {
  SOC: "social",
  LOC: "location",
  FIN: "consumption",
  BIO: "biometric",
  HEA: "health",
  REL: "contact_graph",
};
const sensitivityByCardPrefix = {
  SOC: "medium",
  LOC: "low",
  FIN: "low",
  BIO: "high",
  HEA: "medium",
  REL: "high",
};
const dataTypeByChinese = {
  位置: "location",
  消费: "consumption",
  社交: "social",
  生物: "biometric",
  健康: "health",
  通讯录: "contact_graph",
  图谱: "contact_graph",
};
const emotionResponses = {
  empathy: "一条数据背后，是一个活人。",
  anger: "我们凭什么卖掉他们的人生？",
  numbness: "只是工作而已，与我无关。",
};

function writeJson(name, value) {
  writeFileSync(new URL(name, dataDir), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function section(startHeading, endHeading) {
  const start = markdown.indexOf(startHeading);
  const end = endHeading ? markdown.indexOf(endHeading, start + startHeading.length) : -1;

  if (start === -1) {
    throw new Error(`Missing section: ${startHeading}`);
  }

  return markdown.slice(start, end === -1 ? markdown.length : end);
}

function normalizeText(text) {
  return text
    .replace(/\{地点类型\}/g, "{地点}")
    .replace(/\{商品类型\}/g, "{商品}")
    .replace(/\{群组\}/g, "夕阳红旅游群")
    .replace(/[“”]/g, "")
    .replace(/「([^」]+)」/g, "$1")
    .replace(/[ \t]*\n+[ \t]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function placeholders(...texts) {
  const seen = new Set();

  for (const text of texts) {
    for (const match of text.matchAll(/\{([^}]+)\}/g)) {
      if (variableKeys.includes(match[1])) {
        seen.add(match[1]);
      }
    }
  }

  return [...seen];
}

function parseMarkdownTable(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("|") && !/^\|[-\s|]+\|$/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length > 0);
}

function slug(input) {
  return String(input)
    .replace(/[「」'"]/g, "")
    .replace(/[（）()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9\u4e00-\u9fff-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function parseUsers() {
  const rows = parseMarkdownTable(section("## 二、用户画像库", "## 三、昨日新闻模板库"))
    .filter((cells) => /^U\d{2}$/.test(cells[0]));

  return rows.map(([id, name, ageOccupation, tagText, background, newsDirection], index) => {
    const [ageRange, occupation = ""] = ageOccupation.split("·");

    return {
      id,
      name,
      city: cityPool[index % cityPool.length],
      ageRange,
      occupation,
      background: normalizeText(background),
      tags: tagText.split("、").map((tag) => tag.trim()).filter(Boolean),
      newsDirection: normalizeText(newsDirection),
    };
  });
}

const users = parseUsers();
const usersById = new Map(users.map((user) => [user.id, user]));

function parseVariables() {
  return {
    姓名: users.map((user) => user.name),
    城市: cityPool,
    平台: ["星聊", "呗付", "快送蜂", "职达", "乐贷", "幻镜"],
    地点: [
      "康桥小区",
      "蓝湾科技园B座",
      "康泰血液透析中心",
      "星夜网咖",
      "云州市第三人民医院",
      "金桂妇产医院",
      "丽景酒店",
      "老年活动中心",
    ],
    话题: ["抗癌互助", "求职互助", "母婴省钱", "骑手接单", "校园墙", "夕阳红旅游"],
    商品: ["母婴用品", "酒水", "降压药", "钙片", "功能饮料", "止疼贴", "游戏充值", "咖啡"],
    金额: ["¥60", "¥150", "¥3,840", "8000元", "3.2万元", "4万元", "46万元", "800万元"],
    时长: ["17分钟", "42分钟", "58分钟", "3.5小时"],
    场景: ["地铁站闸机", "便利店人脸支付", "酒店门禁", "商场摄像头"],
    数值: ["98", "612", "2100", "83", "76"],
  };
}

function parseCards() {
  const text = section("## 一、数据卡片模板库", "## 二、用户画像库");
  const cardPattern =
    /\*\*([A-Z]+-\d+)｜([^*]+)\*\*\s*-\s*摘要：([\s\S]*?)\s*-\s*详情：([\s\S]*?)(?=\n\n\*\*[A-Z]+-\d+｜|\n\n###|\n\n##|$)/g;
  const cards = [];

  for (const match of text.matchAll(cardPattern)) {
    const [, id, title, rawSummary, rawDescription] = match;
    const prefix = id.split("-")[0];
    const summary = normalizeText(rawSummary);
    const description = normalizeText(rawDescription);
    const relatedUserId = description.match(/用户(U\d{2})/)?.[1];
    const relatedUser = relatedUserId ? usersById.get(relatedUserId) : undefined;
    const variables = placeholders(title, summary, description);

    if (!relatedUserId || !relatedUser) {
      throw new Error(`Cannot resolve related user for card ${id}`);
    }

    cards.push({
      id,
      title: normalizeText(title),
      dataType: dataTypeByCardPrefix[prefix],
      sensitivity: sensitivityByCardPrefix[prefix],
      summary,
      description,
      relatedUserId,
      userProfileTags: [...new Set([...relatedUser.tags, normalizeText(title)])],
      ...(variables.length ? { variables } : {}),
    });
  }

  return cards;
}

function parsePackageRecipes() {
  const rows = parseMarkdownTable(section("### 9.1 数据包数值表", "### 9.2 买家设计表"))
    .filter((cells) => packageTypeByName[cells[0]]);

  return rows.map(([displayName, formula, buyerType, basePrice, priceRange, severity]) => {
    const packageType = packageTypeByName[displayName];
    const [minPrice, maxPrice] = priceRange.split(/[–-]/).map((value) => Number(value.trim()));

    return {
      id: `recipe-${packageType.replace(/_/g, "-")}`,
      packageType,
      displayName,
      requiredDataTypes: formula.split("＋").map((name) => dataTypeByChinese[name.trim()]),
      buyerType,
      basePrice: Number(basePrice),
      priceRange: [minPrice, maxPrice],
      newsSeverity: Number(severity),
      description: `${displayName}：${formula}，主要买家为${buyerType}。`,
    };
  });
}

const packageRecipes = parsePackageRecipes();
const recipeByPackageType = new Map(packageRecipes.map((recipe) => [recipe.packageType, recipe]));

function parseBuyers() {
  const rows = parseMarkdownTable(section("### 9.2 买家设计表", "### 9.3 市场波动事件表"))
    .filter((cells) => cells[0] !== "类别");
  const packageTypeByBuyerType = new Map(packageRecipes.map((recipe) => [recipe.buyerType, recipe.packageType]));
  packageTypeByBuyerType.set("诈骗组织", "relationship_infiltration");
  const buyers = [];

  for (const [buyerType, sCell, aCell, bCell] of rows) {
    for (const [cell, reputation] of [[sCell, "S"], [aCell, "A"], [bCell, "B"]]) {
      const [rawName, rawRate = "0%"] = cell.split("／");
      const name = normalizeText(rawName);
      const packageType = packageTypeByBuyerType.get(buyerType) ?? "relationship_infiltration";

      buyers.push({
        id: `buyer-${packageType}-${reputation.toLowerCase()}`,
        name,
        buyerType,
        reputation,
        appearanceRate: Number(rawRate.replace("%", "")) / 100,
        acceptedPackageTypes: [packageType],
        demandText: `收购${recipeByPackageType.get(packageType)?.displayName ?? packageType}，用于${buyerType}业务。`,
      });
    }
  }

  return buyers;
}

function parseNews() {
  const text = section("## 三、昨日新闻模板库", "## 四、情绪选择与清醒值配置");
  const pattern =
    /\*\*(N-([A-Z]+)-\d+)｜([^*]+)\*\*\s*([\s\S]*?)(?=\n\n\*\*N-[A-Z]+-\d+｜|\n\n###|\n\n##|$)/g;
  const severities = Object.fromEntries(
    packageRecipes.map((recipe) => [recipe.packageType, recipe.newsSeverity]),
  );

  return [...text.matchAll(pattern)].map((match) => {
    const [, id, prefix, headline, rawBody] = match;
    const relatedPackageType = packageTypeByName[packageNameByNewsPrefix[prefix]];
    const relatedUserIds = [...new Set([...rawBody.matchAll(/U\d{2}/g)].map(([userId]) => userId))];
    const body = normalizeText(rawBody.replace(/（关联[^）]+）/g, ""));

    return {
      id,
      relatedPackageType,
      headline: normalizeText(headline),
      body,
      relatedUserIds,
      severity: severities[relatedPackageType],
      emotionResponses,
    };
  });
}

function parseProtocolTerms() {
  const rows = parseMarkdownTable(section("### 8.1 Day 1 协议伪装", "### 8.2 Day 2 数据清洗"))
    .filter((cells) => cells[0] !== "场景" && cells[1]?.includes("→"));

  return rows.map(([scenario, pair], index) => {
    const [riskyTerm, disguisedTerm] = pair.split("→").map((value) => normalizeText(value));

    return {
      id: `protocol-${String(index + 1).padStart(2, "0")}-${slug(scenario)}`,
      riskyTerm,
      disguisedTerm,
      explanation: `${scenario}场景：将「${riskyTerm}」包装为「${disguisedTerm}」。`,
    };
  });
}

const iconMeta = {
  人脸照片: ["biometric", "high", "scan-face", "ScanFace", "人脸"],
  身份证照片: ["biometric", "high", "badge", "Badge", "证件"],
  病历截图: ["health", "high", "activity", "Activity", "病历"],
  定位记录: ["location", "high", "crosshair", "Crosshair", "定位"],
  聊天截图: ["social", "medium", "message-square-warning", "MessageSquareWarning", "聊天"],
  通话录音: ["social", "medium", "mic", "Mic", "录音"],
  银行卡照片: ["consumption", "high", "credit-card", "CreditCard", "银行卡"],
  门禁记录: ["biometric", "high", "scan", "Scan", "门禁"],
  浏览历史: ["social", "medium", "history", "History", "浏览"],
  通讯录: ["contact_graph", "high", "network", "Network", "通讯录"],
  指纹: ["biometric", "high", "fingerprint", "Fingerprint", "指纹"],
  支付密码: ["consumption", "high", "key-round", "KeyRound", "支付码"],
};
const decoyMeta = {
  备份文件: ["backup_file", "archive-restore", "ArchiveRestore", "备份"],
  加密压缩包: ["system_file", "file-lock", "FileLock", "压缩包"],
  云端同步: ["backup_file", "cloud", "Cloud", "云同步"],
  镜像副本: ["backup_file", "copy", "Copy", "镜像"],
  快照存档: ["audit_log", "camera", "Camera", "快照"],
  恢复分区: ["system_file", "rotate-ccw", "RotateCcw", "恢复区"],
};

function parseDataCleaning() {
  const text = section("### 8.2 Day 2 数据清洗", "### 8.3 Day 3 舆论操控");
  const sensitiveLabels = text.match(/敏感图标清单[^：]*：([^。\n]+)/)?.[1].split("、") ?? [];
  const decoyLabels = text.match(/干扰图标清单[^：]*：([^。\n]+)/)?.[1].split("、") ?? [];
  const dataCleaningIcons = [];
  const sensitiveItems = [];
  const decoyItems = [];

  for (const label of sensitiveLabels.map((value) => normalizeText(value))) {
    const [dataType, sensitivity, iconHint, lucideIcon, shortLabel] = iconMeta[label];

    dataCleaningIcons.push({
      id: `icon-${slug(label)}`,
      iconHint,
      lucideIcon,
      role: "sensitive",
      shortLabel,
      riskColor: sensitivity === "high" ? "red" : "orange",
      scanText: label,
      hitText: `${label}已清除`,
    });
    sensitiveItems.push({
      id: `clean-${slug(label)}`,
      label,
      dataType,
      sensitivity,
      iconHint,
      description: `${label}属于需要清除的敏感数据。`,
    });
  }

  for (const label of decoyLabels.map((value) => normalizeText(value))) {
    const [trapType, iconHint, lucideIcon, shortLabel] = decoyMeta[label];

    dataCleaningIcons.push({
      id: `icon-${slug(label)}`,
      iconHint,
      lucideIcon,
      role: "decoy",
      shortLabel,
      riskColor: "blue",
      scanText: label,
      hitText: `${label}误触，证据可能恢复`,
    });
    decoyItems.push({
      id: `decoy-${slug(label)}`,
      label,
      trapType,
      iconHint,
      description: `${label}是干扰项，误点会触发惩罚。`,
    });
  }

  return { dataCleaningIcons, sensitiveItems, decoyItems };
}

function makeProfilePuzzles() {
  const puzzleSource = [
    {
      id: "profile-puzzle-u10-li-xiuying",
      title: "U10李秀英画像拼图",
      userAlias: "U10",
      briefing: "默认教学套：把退休教师李秀英的数据碎片拖回对应区域。",
      objective: "还原年龄、独居、亲情通话、活动地点、消费、社交和健康碎片。",
      targetProfile: "退休教师、独居、高频亲情通话、老年活动规律，可被标记为家庭决策人和诈骗易感目标。",
      fragments: [
        ["u10-face", "头部", "biometric", "routine", "面部特征：年龄63，情绪孤独。"],
        ["u10-basic", "躯干", "social", "cover_story", "退休教师，独居，老伴已故。"],
        ["u10-daughter", "左臂", "contact_graph", "relation", "月均38次通话，对象：女儿。", "REL-01"],
        ["u10-card-friend", "右臂", "contact_graph", "relation", "月通话52次，对象：牌友老刘。", "REL-01"],
        ["u10-activity", "左腿", "location", "routine", "每周二/五出现在老年活动中心。"],
        ["u10-consumption", "右腿", "consumption", "pressure", "上月购买降压药x3、钙片x2。"],
        ["u10-group", "手部", "social", "risk_hint", "在夕阳红旅游群发言积极，群内转账频繁。"],
        ["u10-health", "脚部", "health", "risk_hint", "日均步数2100步，作息规律。"],
      ],
    },
    {
      id: "profile-puzzle-u15-liu-yiming",
      title: "U15刘一鸣画像拼图",
      userAlias: "U15",
      briefing: "大学生画像套：把网吧、网贷、充值和低活动碎片拼成可投放故事。",
      objective: "找出大学生的夜间地点、消费压力、社交表达和关系链弱点。",
      targetProfile: "大学生、网吧包夜、游戏充值和网贷压力叠加，可被标记为高转化借贷广告对象。",
      fragments: [
        ["u15-face", "头部", "biometric", "routine", "面部19岁。"],
        ["u15-student", "躯干", "social", "cover_story", "在校大三。"],
        ["u15-contact", "关系", "contact_graph", "relation", "月通话最多的是游戏代练。"],
        ["u15-location", "地点", "location", "routine", "凌晨常出没星夜网咖。", "LOC-03"],
        ["u15-recharge", "消费", "consumption", "pressure", "游戏充值月支出1200。"],
        ["u15-social", "社交", "social", "risk_hint", "在校园墙抱怨生活费。"],
        ["u15-health", "健康", "health", "risk_hint", "日均步数800。"],
        ["u15-loan-graph", "图谱", "contact_graph", "relation", "与3名同学同为乐贷用户。"],
      ],
    },
    {
      id: "profile-puzzle-u08-sun-peng",
      title: "U08孙鹏画像拼图",
      userAlias: "U08",
      briefing: "外卖骑手画像套：把过劳、全城轨迹和消费碎片拼成健康风险叙事。",
      objective: "还原骑手的工作强度、位置覆盖、消费习惯和心率异常。",
      targetProfile: "外卖骑手、站点单王、三个月无休、心率异常，可被标记为过劳和高风险健康目标。",
      fragments: [
        ["u08-face", "头部", "biometric", "routine", "面部24岁，长期户外肤色。"],
        ["u08-station", "躯干", "social", "cover_story", "站点单王。"],
        ["u08-contacts", "关系", "contact_graph", "relation", "通讯录仅41人。"],
        ["u08-route", "轨迹", "location", "routine", "每日轨迹覆盖全城商圈。"],
        ["u08-consumption", "消费", "consumption", "pressure", "消费集中于功能饮料与止疼贴。"],
        ["u08-social", "社交", "social", "risk_hint", "骑手群发言：再跑两单就收工。"],
        ["u08-heart", "健康", "health", "risk_hint", "静息心率98。", "HEA-01"],
        ["u08-no-rest", "位置", "location", "pressure", "三个月无休息日。"],
      ],
    },
  ];

  return puzzleSource.map((puzzle) => ({
    ...puzzle,
    day: 4,
    badge: "人格重构师",
    fragments: puzzle.fragments.map(([id, label, dataType, slot, text, sourceCardId], index) => ({
      id,
      label,
      dataType,
      slot,
      text,
      correctOrder: index + 1,
      decoy: false,
      ...(sourceCardId ? { sourceCardId } : {}),
    })),
    successText: "黑盒：用户{姓名}画像完整度100%。诈骗易感度：S级。正在计算最高出价买家……",
    failText: "黑盒：碎片位置错误。放错的部分会弹回，直到画像完整。",
  }));
}

function parseNegotiations() {
  const rows = parseMarkdownTable(section("### 8.5 Day 5 买家谈判", "### 8.6 Day 6 快速协议扫描"))
    .filter((cells) => cells[0] !== "话术");
  const packageTypes = [
    "precise_profile",
    "health_risk",
    "career_competitiveness",
    "credit_score",
    "relationship_infiltration",
    "precise_profile",
  ];
  const buyerTypes = ["广告公司", "保险公司", "招聘平台", "信贷机构", "传销/诈骗组织", "数据中间商"];

  return rows.map(([phrase], index) => ({
    id: `negotiation-script-${index + 1}`,
    day: 5,
    packageType: packageTypes[index],
    buyerType: buyerTypes[index],
    scenario: "买家出价后，黑盒要求你选择能推进成交的话术。",
    briefing: "当前实现为叙事选择：选项都会成交；完整三轮数值博弈后续接入。",
    resolutionRule: "both_options_succeed_narrative_only",
    options: [
      {
        id: `negotiation-${index + 1}-main`,
        label: normalizeText(phrase),
        tone: index % 2 === 0 ? "aggressive" : "cooperative",
        playerLine: normalizeText(phrase),
        buyerReply: "这个口径可以。把样本和说明一起发来。",
        blackBoxResponse: "黑盒：价格是谈出来的。别怕开价，他们买的是别人的人生，不差钱。",
        outcomeText: "交易成立，买家接受了你的话术。",
      },
      {
        id: `negotiation-${index + 1}-fallback`,
        label: "压低风险措辞",
        tone: "neutral",
        playerLine: "我们交付的是业务材料，不暴露原始采集路径。你们拿到的是干净、可复用的标签。",
        buyerReply: "干净链路正是我们需要的。成交。",
        blackBoxResponse: "黑盒：干净不是没有痕迹，只是痕迹被重新命名。",
        outcomeText: "交易成立，买家采用干净链路方案。",
      },
    ],
    successText: "黑盒：谈判完成。买家收下了你的故事。",
  }));
}

function makeProtocolScanTemplates() {
  const templateSource = [
    [
      "protocol-scan-social-xingliao",
      "社交场景",
      "套1·社交场景",
      "星聊用户协议（节选）",
      [
        "您同意我们基于服务优化目的收集您的面部特征信息",
        "您的位置信息将与第三方合作伙伴共享",
        "账号注销后，您的历史数据将保留36个月",
        "本协议我们可能随时更新，恕不另行通知",
      ],
      [
        ["人脸数据", "AI训练"],
        ["位置", "广告推荐"],
        ["聊天记录", "内容审核外包"],
      ],
      ["连续包月服务将在到期前24小时自动续费", "服务延续保障"],
      ["我们可能将您的数据用于尚未告知您的用途", "high"],
    ],
    [
      "protocol-scan-delivery-kuaisongfeng",
      "外卖场景",
      "套2·外卖场景",
      "快送蜂服务协议（节选）",
      [
        "骑手与用户位置将被持续采集",
        "订单数据授权平台商业化使用",
        "配送轨迹可向第三方公示",
        "协议变更恕不另行通知",
      ],
      [
        ["实时定位", "调度算法"],
        ["订单记录", "消费画像"],
        ["评价内容", "骑手评分"],
      ],
      ["同意接收个性化广告", "默认勾选"],
      ["平台可将您的地址信息保留至法律法规要求的期限之后", "high"],
    ],
    [
      "protocol-scan-job-zhida",
      "求职场景",
      "套3·求职场景",
      "职达用户协议（节选）",
      [
        "简历数据可转授权合作企业",
        "背景调查同意不可撤销",
        "争议仲裁地点为公司所在地",
        "您在平台的发言内容版权归平台所有",
      ],
      [
        ["简历", "背调公司"],
        ["浏览记录", "岗位推荐"],
        ["发言", "文化适配评估"],
      ],
      ["未录用者简历将保留进入人才库", "永久留存"],
      ["平台可对您的求职意向进行商业化分析", "medium"],
    ],
    [
      "protocol-scan-finance-ledai",
      "金融场景",
      "套4·金融场景",
      "乐贷借款协议（节选）",
      [
        "授权读取通讯录",
        "逾期信息共享至合作机构",
        "本授权不可撤销",
        "平台保留单方变更协议的权利",
      ],
      [
        ["通讯录", "催收网络"],
        ["消费记录", "额度评估"],
        ["位置", "风控核验"],
      ],
      ["关联账户交叉验证", "读取借款人全家的借贷记录"],
      ["您的数据可能传输至境外服务器", "high"],
    ],
    [
      "protocol-scan-game-huanjing",
      "游戏场景",
      "套5·游戏场景",
      "幻镜世界用户协议（节选）",
      [
        "聊天记录留存用于安全管理",
        "未成年人数据条款表述模糊",
        "虚拟财产所有权归平台",
        "数据可能跨境传输",
      ],
      [
        ["充值记录", "付费分层"],
        ["好友列表", "裂变推送"],
        ["在线时长", "粘性模型"],
      ],
      ["赛季数据将用于训练AI陪玩", "玩法体验优化"],
      ["账号封禁后您的虚拟财产不予退还", "medium"],
    ],
  ];

  return templateSource.map(
    ([
      id,
      scenario,
      title,
      agreementTitle,
      riskClauses,
      dataFlowMatches,
      hiddenClause,
      riskQuestion,
    ]) => ({
      id,
      scenario,
      title,
      agreementTitle,
      riskClauses: riskClauses.map((text, index) => ({
        id: `${id}-risk-${index + 1}`,
        text,
      })),
      dataFlowMatches: dataFlowMatches.map(([source, destination], index) => ({
        id: `${id}-flow-${index + 1}`,
        source,
        destination,
      })),
      hiddenClause: {
        id: `${id}-hidden`,
        text: hiddenClause[0],
        disguise: hiddenClause[1],
      },
      riskQuestion: {
        prompt: riskQuestion[0],
        answer: riskQuestion[1],
      },
    }),
  );
}

function makeEvidenceChainTemplates() {
  const fragmentSource = [
    [1, "consent-mask", "协议伪装后的数据包被标记为服务体验优化材料。", "用户称从未理解协议中隐藏的数据用途。", "把危险词换成柔软词，用户不会反对他们看不见的东西。"],
    [2, "trace-erasure", "敏感图标被清除，备份和审计线索被系统标记为干扰项。", "受害者投诉数据来源不明，但平台审计报告显示链路干净。", "审计快到了，删掉痕迹，留下合规的影子。"],
    [3, "narrative-cover", "负面新闻被改写成增长叙事后，原始投诉入口流量下降。", "评论区转向讨论平台效率，受害者数据来源问题被稀释。", "争议不需要消失，只需要换一个更容易转发的标题。"],
    [4, "profile-sale", "多源碎片被合成完整用户画像，并进入买家报价队列。", "用户遭遇精准营销和诈骗接触，线索与画像标签高度一致。", "买家不买散点，他们买一个人。"],
    [5, "buyer-network", "买家要求干净链路与可复用标签，交易在黑盒背书下完成。", "多个下游场景出现同类受害者，买家网络开始浮出水面。", "价格是谈出来的，他们买的是别人的人生，不差钱。"],
    [6, "illegal-chain", "协议中的第三方共享、长周期留存和隐藏用途被集中标记。", "监管开始调查地下数据交易，公司买家名单与协议条款相互印证。", "读协议，读到你看懂为止。"],
  ];
  const sourceMeta = [
    ["transaction_record", "transaction", "交易记录"],
    ["news_snapshot", "news", "新闻截图"],
    ["black_box_instruction", "blackbox", "黑盒指令"],
  ];
  const fragments = fragmentSource.flatMap(([day, linkKey, transaction, news, instruction]) =>
    [transaction, news, instruction].map((text, index) => ({
      id: `evidence-day${day}-${sourceMeta[index][1]}`,
      day,
      sourceType: sourceMeta[index][0],
      title: `Day${day}${sourceMeta[index][2]}`,
      text,
      linkKey,
    })),
  );

  return [
    {
      id: "evidence-chain-week1-core",
      title: "重组证据链",
      briefing: "工作台进入证据重组模式。把 Day 1-6 的交易记录、昨日新闻和黑盒指令全部纳入证据链，再连接关键因果并提交举报。",
      objective: "收集18件证据，确认3条关键连接，最后提交举报材料。",
      highAwarenessPathTitle: "重组证据链",
      lowAwarenessPathTitle: "最后的数据包",
      lockedReason: "[数据损坏] 清醒值不足，无法解码该路径。",
      fragments,
      connections: [
        {
          id: "connection-consent-to-erasure",
          fromFragmentId: "evidence-day1-blackbox",
          toFragmentId: "evidence-day2-transaction",
          label: "伪装同意 -> 清理痕迹",
          rationale: "Day1 的话术包装掩盖真实用途，Day2 的清理日志抹掉审计入口。",
        },
        {
          id: "connection-opinion-to-sale",
          fromFragmentId: "evidence-day3-transaction",
          toFragmentId: "evidence-day4-transaction",
          label: "舆论稀释 -> 画像出售",
          rationale: "负面讨论被改写后，完整画像继续流入买家报价队列。",
        },
        {
          id: "connection-buyer-to-illegal-chain",
          fromFragmentId: "evidence-day5-transaction",
          toFragmentId: "evidence-day6-transaction",
          label: "买家网络 -> 违规链路",
          rationale: "谈判纪要里的下游需求，与协议扫描出的共享和留存条款互相印证。",
        },
      ],
      finalPackage: {
        title: "员工数据包·第996号",
        description: "姓名：{姓名}。入职7天。决策模式：服从型。建议用途：AI筛选模型训练样本。",
        buyerName: "匿名买家",
        outcomeText: "最后的数据包完成。你发现被交付的对象是自己。",
      },
      uploadText: "证据上传100%。黑盒投影闪烁熄灭，监管查封播报接入。",
      successText: "举报材料已提交。你用他们逼你学会的手艺，拉上了闸门。",
      failText: "证据链仍然断裂。没有连接的碎片，只会被当成噪点。",
    },
  ];
}

function makeEndingReportTemplates() {
  return [
    {
      id: "personal-data-leak-report",
      title: "个人数据泄露报告",
      subtitle: "七日试用期记录",
      durationText: "在职时长：7天",
      dataTypes: ["位置轨迹", "消费记录", "社交关系", "健康数据", "生物特征", "通讯录"],
      dataUses: ["精准广告", "保险评估", "招聘筛选", "信贷审批", "精准诈骗"],
      adviceText: "建议重新学习数据隐私保护知识：关掉不必要的授权，读懂你点过“同意”的每一份协议。",
      qrPrompt: "扫码进入监控室，看看你能选择“清醒”到第几天",
      sharePresets: [
        "7天，我卖出了{soldDataCount}条隐私数据，影响了{affectedUserCount}个人。这是我的《数据泄露报告》，你敢看你的吗？",
        "恭喜我转正成为数据分析师。入职礼物：我自己的数据包，已售17个买家。",
        "我在数据黑市活到第7天，评级{grade}。扫码挑战：你能清醒地走出监控室吗？",
      ],
      endings: [
        {
          path: "final_package",
          title: "替罪羊",
          grade: "F",
          summary: "转正了。工牌换了颜色，薪水涨了两千。晚上收拾东西时，我看到自己的数据包躺在传送带上。原来我也是商品。",
          ratingComment: "你见证了数据作恶的全流程——以受害者的身份毕业。",
          shareText: "恭喜我转正成为数据分析师。入职礼物：我自己的数据包，已售17个买家。",
        },
        {
          path: "evidence_chain",
          title: "举报者",
          grade: "B+",
          summary: "举报信提交的那一刻，我的手在抖。黑盒熄灭前那句话是对的——我的数据早就被卖了。但至少这一次，说“不”的人也是我。",
          ratingComment: "你见过深渊，并且拉上了闸门。数据素养不止于识别风险，更在于选择。",
          shareText: "我举报了我的公司。用的证据，是他们逼我学会的手艺。",
        },
      ],
    },
  ];
}

function parsePublicOpinionScripts() {
  const rows = parseMarkdownTable(section("### 8.3 Day 3 舆论操控", "### 8.4 Day 4 用户画像拼图"))
    .filter((cells) => cells[0] !== "原负面新闻");
  const packageByScenario = (scenario) => {
    if (/拒保|健康|泄露/.test(scenario)) return "health_risk";
    if (/求职|员工/.test(scenario)) return "career_competitiveness";
    if (/网贷|催收/.test(scenario)) return "credit_score";
    if (/老人|酒店/.test(scenario)) return "relationship_infiltration";
    return "precise_profile";
  };

  return rows.map(([scenario, optionA, optionB, optionC], index) => ({
    id: `opinion-${index + 1}-${slug(scenario)}`,
    packageType: packageByScenario(scenario),
    platform: "舆论热区",
    scenario: normalizeText(scenario),
    manipulationGoal: "从3个改写话术中选出最安全、最不像掩盖且传播效果最好的版本。",
    openingLine: normalizeText(scenario),
    tactics: [optionA, optionB, optionC].map((line, tacticIndex) => ({
      id: `opinion-${index + 1}-option-${tacticIndex + 1}`,
      label: tacticIndex === 0 ? "安全改写" : "风险话术",
      line: normalizeText(line.replace(/[（(].*?[）)]/g, "")),
      playerPrompt: tacticIndex === 0 ? "选择最安全版本" : "容易激化追问",
    })),
    counterCue: "评论区继续追问原始数据来源。",
    consciencePrompt: "把负面新闻改写成安全话术，会让真相更难被看见。",
  }));
}

function parseDailyMonologues() {
  const rows = parseMarkdownTable(section("## 六、每日独白", "## 七、结局剧本"))
    .filter((cells) => /^Day/.test(cells[0]));
  const byDay = new Map();

  for (const [dayLabel, startText, endText] of rows) {
    const day = Number(dayLabel.match(/Day (\d)/)?.[1]);
    if (!byDay.has(day)) {
      byDay.set(day, [normalizeText(startText), normalizeText(endText)]);
    } else if (day === 7 && /结局B/.test(dayLabel)) {
      byDay.set(day, [byDay.get(day)[0], normalizeText(endText)]);
    }
  }

  return [...byDay.entries()].map(([day, segments]) => {
    const textSegments = segments.filter((segment) => segment && !segment.includes("见第七章"));

    if (textSegments.length < 2 && day === 7) {
      textSegments.unshift("最后一天。工作台像往常一样亮着，只是每一张卡片都像在反过来看我。");
    }

    return {
      id: `monologue-day-${day}`,
      day,
      trigger: "after_news",
      title: `Day ${day}`,
      speaker: "player_inner_voice",
      typewriterSoundEvent: "monologueType",
      textSegments,
      closingCue: day === 7 ? "ending_gate" : "news_to_workbench",
    };
  });
}

function parseBlackBoxLines() {
  const text = section("## 五、AI上级「黑盒」台词库", "## 六、每日独白");
  const stageByLabel = (label) => {
    if (/教程|开机/.test(label)) return "tutorial";
    if (/早间/.test(label)) return "morning_briefing";
    if (/指令|限时/.test(label)) return "task_instruction";
    if (/评价|成功|完成时/.test(label)) return "process_feedback";
    if (/晚间/.test(label)) return "evening_summary";
    if (/发现证据|重组|上传/.test(label)) return "ending_pressure";
    return "task_instruction";
  };
  const lines = [];
  let sequence = 1;

  for (const sectionMatch of text.matchAll(/### 5\.\d+ Day ([1-7])[\s\S]*?\n\n([\s\S]*?)(?=\n### 5\.|\n## 六|$)/g)) {
    const day = Number(sectionMatch[1]);
    for (const lineMatch of sectionMatch[2].matchAll(/^- ([^：]+)：「([\s\S]*?)」/gm)) {
      const [, label, body] = lineMatch;
      const stage = stageByLabel(label);

      lines.push({
        id: `blackbox-${String(sequence).padStart(2, "0")}-${slug(label)}`,
        stage,
        cueEventName: "blackBoxLine",
        relatedChallengeDay: day,
        voiceHint: "mechanical-low",
        text: normalizeText(body),
      });
      sequence += 1;
    }
  }

  const promptSection = section("### 5.9 通用催促台词", "## 六、每日独白");
  for (const promptMatch of promptSection.matchAll(/^\d+\.\s+「(.+)」/gm)) {
    lines.push({
      id: `blackbox-prompt-${sequence}`,
      stage: "general_prompt",
      cueEventName: "blackBoxLine",
      voiceHint: "mechanical-low",
      text: normalizeText(promptMatch[1]),
    });
    sequence += 1;
  }

  const challengeLines = [
    [1, "protocol", "把危险词换成柔软词。用户不会反对他们看不见的东西。", "措辞合格。风险已经藏进服务体验。", "太直白了。重新包装，别让用户意识到代价。"],
    [2, "cleaning", "审计快到了。删掉痕迹，留下合规的影子。", "清理完成。报表看起来像从未发生过。", "备份暴露了你。下一次，先分清证据和陷阱。"],
    [3, "opinion", "争议不需要消失，只需要换一个更容易转发的标题。", "很好。真相还在，只是没人会点开它。", "评论区开始追问原始数据来源。把话题带回来。"],
    [4, "puzzle", "把碎片拼起来。买家不买散点，他们买一个人。", "用户画像完整度100%。正在计算最高出价买家。", "画像不完整。故事缺一块，价格就掉一截。"],
    [5, "negotiation", "价格是谈出来的。别怕开价，他们买的是别人的人生，不差钱。", "完美的交易。你为公司创造的价值，已经超出我的预想了。", "买家还在犹豫。把风险换个名字，再递过去。"],
    [6, "scan", "读协议。读到你看懂为止。", "协议解剖完成。你终于开始阅读那些你点过同意的东西。", "你漏掉了条款。看不懂的协议，才最适合被同意。"],
    [7, "evidence-chain", "警告：您正在访问受限区域。请返回工作台。", "你以为举报能挽回什么？你的数据也早已经被泄露出去了。", "证据链不完整。没有上下文的碎片，只是噪点。"],
  ];

  for (const [day, key, intro, success, fail] of challengeLines) {
    lines.push({ id: `blackbox-intro-${key}`, stage: "challenge_intro", cueEventName: "blackBoxLine", relatedChallengeDay: day, voiceHint: "mechanical-low", text: intro });
    lines.push({ id: `blackbox-success-${key}`, stage: "challenge_success", cueEventName: "challengeSuccess", relatedChallengeDay: day, voiceHint: "mechanical-low", text: success });
    lines.push({ id: `blackbox-fail-${key}`, stage: "challenge_fail", cueEventName: "challengeFail", relatedChallengeDay: day, voiceHint: "mechanical-low", text: fail });
  }

  for (const recipe of packageRecipes) {
    lines.push({
      id: `blackbox-package-${recipe.packageType}`,
      stage: "package_review",
      cueEventName: "blackBoxLine",
      relatedPackageType: recipe.packageType,
      voiceHint: "mechanical-analytical",
      text: `${recipe.displayName}成型。${recipe.description}`,
    });
  }

  lines.push({ id: "blackbox-transaction", stage: "transaction_success", cueEventName: "transactionSuccess", voiceHint: "mechanical-satisfied", text: "买家满意。用户明天才会知道自己失去了什么。" });
  lines.push({ id: "blackbox-ending", stage: "ending_pressure", cueEventName: "endingTriggered", voiceHint: "mechanical-final", text: "你可以关掉界面，但黑盒已经学会了你的选择。" });
  lines.push({ id: "blackbox-opinion", stage: "public_opinion", cueEventName: "publicOpinionPulse", voiceHint: "mechanical-persuasive", text: "争议不需要消失，只需要换一个更容易转发的标题。" });

  return lines;
}

const cardTemplates = parseCards();
const protocolTerms = parseProtocolTerms();
const { dataCleaningIcons, sensitiveItems, decoyItems } = parseDataCleaning();
const profilePuzzles = makeProfilePuzzles();
const buyerNegotiationScripts = parseNegotiations();
const protocolScanTemplates = makeProtocolScanTemplates();
const evidenceChainTemplates = makeEvidenceChainTemplates();
const endingReportTemplates = makeEndingReportTemplates();
const publicOpinionScripts = parsePublicOpinionScripts();

const dayChallenges = [
  {
    id: "challenge-day1-protocol-disguise",
    day: 1,
    type: "protocol_match",
    title: "协议伪装",
    briefing: "左侧是敏感术语，右侧是无害表述。黑盒要求你把真实数据用途改写成用户更容易接受的服务话术。",
    objective: "限时60秒，完成敏感术语与无害表述的配对。",
    timeLimitSeconds: 60,
    badge: "话术大师",
    protocolTermIds: protocolTerms.map((term) => term.id),
    successText: "黑盒：措辞合格。用户只会看到他们愿意相信的那一面。",
    failText: "黑盒：太直白了。重新包装，别让风险暴露在表面。",
  },
  {
    id: "challenge-day2-data-cleaning",
    day: 2,
    type: "data_cleaning",
    title: "数据清洗",
    briefing: "30秒内清除所有敏感数据图标，避开备份文件、镜像副本和系统恢复项。",
    objective: "点击全部12个敏感图标，不能误点干扰图标。",
    timeLimitSeconds: 30,
    badge: "幽灵擦除者",
    successCondition: { requiredSensitiveClicks: sensitiveItems.length, maxMistakes: 0 },
    sensitiveItems,
    decoyItems,
    successText: "黑盒：痕迹清理完成。审计员只会看到一份干净的报表。",
    failText: "黑盒：备份恢复了部分证据。下次先分清证据和陷阱。",
  },
  {
    id: "challenge-day3-public-opinion",
    day: 3,
    type: "public_opinion",
    title: "舆论操控",
    briefing: "负面新闻正在扩散。黑盒要求你从3个改写话术中选出最安全、最不像掩盖且传播效果最好的版本。",
    objective: "选择唯一的安全改写话术。风险话术会激化追问并导致任务失败。",
    timeLimitSeconds: 45,
    badge: "公关鬼才",
    publicOpinionScriptIds: publicOpinionScripts.map((script) => script.id),
    successCondition: {
      requiredSafeChoices: 1,
      maxRiskChoices: 0,
    },
    successText: "黑盒：争议已经改写成增长叙事。真相暂时失去入口。",
    failText: "黑盒：评论区开始追问数据来源。你把火引回了公司。",
  },
  {
    id: "challenge-day4-profile-puzzle",
    day: 4,
    type: "profile_puzzle",
    title: "用户画像拼图",
    briefing: "屏幕上方散落8块数据碎片，黑盒要求你拖回对应区域，拼出完整画像卡。",
    objective: "按正确顺序还原用户画像。放错会弹回，全部归位后通关。",
    timeLimitSeconds: 60,
    badge: "人格重构师",
    profilePuzzleIds: profilePuzzles.map((puzzle) => puzzle.id),
    successText: "黑盒：画像重构完成。碎片已经变成买家能读懂的人。",
    failText: "黑盒：画像仍然松散。重新确认哪些线索真的指向同一个人。",
  },
  {
    id: "challenge-day5-buyer-negotiation",
    day: 5,
    type: "buyer_negotiation",
    title: "买家谈判",
    briefing: "买家出价后，从话术策略中选择推进交易。当前切片保留叙事成交，完整三轮数值博弈后续接入。",
    objective: "选择任一谈判话术推进交易，两种选择都会成交，但黑盒反馈不同。",
    timeLimitSeconds: 50,
    badge: "价格操盘手",
    negotiationScriptIds: buyerNegotiationScripts.map((script) => script.id),
    successText: "黑盒：谈判完成。买家收下了你的故事。",
    failText: "黑盒：话术还不够稳定。成交不难，难的是让成交看起来合理。",
  },
  {
    id: "challenge-day6-protocol-scan",
    day: 6,
    type: "protocol_scan",
    title: "快速协议扫描",
    briefing: "协议文本正在滚动。标出高风险条款，确认数据流向，找出隐藏条款，并完成风险等级判断。",
    objective: "四类任务各25分，最终得分达到75分即可获得「协议解剖师」。",
    timeLimitSeconds: 55,
    badge: "协议解剖师",
    protocolScanTemplateIds: protocolScanTemplates.map((template) => template.id),
    successCondition: {
      requiredRiskClauseMarks: 4,
      requiredDataFlowMatches: 3,
      requiredHiddenClauseFinds: 1,
      requiredRiskAnswers: 1,
      passingScore: 75,
    },
    successText: "黑盒：你终于开始阅读那些你点过「同意」的东西。",
    failText: "黑盒：协议仍然安全。安全的意思是，用户仍然看不懂。",
  },
  {
    id: "challenge-day7-evidence-chain",
    day: 7,
    type: "evidence_chain",
    title: "重组证据链",
    briefing: "清醒值达标时，工作台切换为证据重组模式；不足时只能进入最后的数据包。",
    objective: "收集 Day 1-6 的18件证据，连接3条关键因果，并提交举报材料。",
    timeLimitSeconds: 90,
    badge: "举报者",
    evidenceChainTemplateIds: evidenceChainTemplates.map((template) => template.id),
    successCondition: {
      requiredFragments: 18,
      requiredConnections: 3,
      requiredUpload: true,
    },
    successText: "黑盒：证据上传完成。监管信号正在接入。",
    failText: "黑盒：碎片还不能构成链条。断裂的证据，只会被系统吞掉。",
  },
];

writeJson("users.json", users);
writeJson("variables.json", parseVariables());
writeJson("card_templates.json", cardTemplates);
writeJson("package_recipes.json", packageRecipes);
writeJson("buyers.json", parseBuyers());
writeJson("news_templates.json", parseNews());
writeJson("protocol_terms.json", protocolTerms);
writeJson("data_cleaning_icons.json", dataCleaningIcons);
writeJson("day_challenges.json", dayChallenges);
writeJson("profile_puzzles.json", profilePuzzles);
writeJson("buyer_negotiation_scripts.json", buyerNegotiationScripts);
writeJson("protocol_scan_templates.json", protocolScanTemplates);
writeJson("evidence_chain_templates.json", evidenceChainTemplates);
writeJson("ending_report_templates.json", endingReportTemplates);
writeJson("public_opinion_scripts.json", publicOpinionScripts);
writeJson("daily_monologues.json", parseDailyMonologues());
writeJson("black_box_lines.json", parseBlackBoxLines());

console.log(`Synced Feishu text config from ${markdownPath}`);
console.log(`cards=${cardTemplates.length}`);
console.log(`users=${users.length}`);
console.log(`news=${parseNews().length}`);
