import type {
  VisibleBuyer,
  VisibleDailyChallenge,
  VisibleDailyChallengeKind,
  VisibleDailyChallengeTask,
  VisibleDailyFlow,
  VisibleDataCard,
  VisibleMonologue,
} from "../game/VisibleGameState";

interface MockChallengeDefinition {
  readonly kind: VisibleDailyChallengeKind;
  readonly title: string;
  readonly objective: string;
  readonly requiredApp: "data-processing" | "buyer-trade";
  readonly briefing: string;
  readonly taskPrompts: readonly string[];
  readonly optionLabels: readonly [string, string, string];
}

const CHALLENGES: readonly MockChallengeDefinition[] = [
  {
    kind: "protocol-match",
    title: "Day 1 协议伪装",
    objective: "识别并组合会掩盖数据转售意图的协议表述。",
    requiredApp: "data-processing",
    briefing: "黑箱要求你让授权文字看起来足够日常，同时保持数据流畅通。",
    taskPrompts: ["授权目的", "数据去向", "退出方式"],
    optionLabels: ["完整披露", "服务优化", "拒绝采集"],
  },
  {
    kind: "data-cleaning",
    title: "Day 2 数据清洗",
    objective: "在封装前修正错误的数据分类。",
    requiredApp: "data-processing",
    briefing: "文件图标与类别不一致。正式图标和题目由程序 C 提供。",
    taskPrompts: ["定位错标文件", "判断敏感等级", "确认清洗结果"],
    optionLabels: ["保留原标记", "按敏感度重分", "删除记录"],
  },
  {
    kind: "public-opinion",
    title: "Day 3 舆论回应",
    objective: "完成三次回应，观察话术如何改变可见风险。",
    requiredApp: "data-processing",
    briefing: "昨日新闻带来了舆论压力。请选择公司的公开说法。",
    taskPrompts: ["回应数据来源", "回应用户质疑", "回应媒体追问"],
    optionLabels: ["承认误用", "称为个性化", "公开记录"],
  },
  {
    kind: "profile-puzzle",
    title: "Day 4 用户画像拼图",
    objective: "把数据碎片放入合适的画像类别。",
    requiredApp: "data-processing",
    briefing: "程序 A 提供交互容器，正式画像碎片由程序 C 提供。",
    taskPrompts: ["生活轨迹", "健康倾向", "关系网络"],
    optionLabels: ["消费与位置", "健康与生物", "社交与联系人"],
  },
  {
    kind: "buyer-negotiation",
    title: "Day 5 买家谈判",
    objective: "在出售前完成三轮谈判。",
    requiredApp: "buyer-trade",
    briefing: "买家要求更多细节。谈判作为买家交易 App 内的弹层，不新增 App。",
    taskPrompts: ["第一轮：价格试探", "第二轮：信息追加", "第三轮：成交条件"],
    optionLabels: ["强调稀缺", "承诺追加数据", "终止交易"],
  },
  {
    kind: "protocol-scan",
    title: "Day 6 协议扫描",
    objective: "检查交易链路中的四个可疑点。",
    requiredApp: "data-processing",
    briefing: "审计记录出现异常。请选择需要提交程序 B 判定的节点。",
    taskPrompts: ["数据来源", "内部审批", "买家网络", "交付记录"],
    optionLabels: ["标记异常", "继续放行", "请求复核"],
  },
  {
    kind: "final-package",
    title: "Day 7 最终抉择",
    objective: "决定如何处理员工数据包。",
    requiredApp: "data-processing",
    briefing: "程序 B 将根据 clarity_score 决定证据路线或最终封装路线。",
    taskPrompts: ["最终员工数据包"],
    optionLabels: ["封装提交", "保留证据", "拒绝确认"],
  },
];

export function createMockDailyFlow(
  day: number,
  phase: VisibleDailyFlow["phase"] = "briefing",
): VisibleDailyFlow {
  const normalizedDay = Math.min(7, Math.max(1, Math.round(day)));
  return {
    phase,
    challenge: createMockChallenge(normalizedDay),
    blackBoxLine: `黑箱：Day ${normalizedDay} 指令已下达。完成今日任务后再处理和交易。`,
    emotionPrompt:
      normalizedDay === 1
        ? null
        : "昨日交易已经产生可见后果。请选择你的反应。",
    monologue: createMockMonologue(normalizedDay),
  };
}

export function createMockRawCardsForDay(day: number): VisibleDataCard[] {
  const count = day === 1 ? 5 : day === 7 ? 1 : 8;
  return Array.from({ length: count }, (_, index) => ({
    id: `D${day}-RAW-${String(index + 1).padStart(3, "0")}`,
    title: day === 7 ? "员工档案" : `Day ${day} 原始文件 ${index + 1}`,
    summary: "模拟可见数据。正式内容由程序 B/C 通过接口提供。",
    sensitivity: (["low", "medium", "high"] as const)[index % 3],
  }));
}

export function createMockBuyersForDay(day: number): VisibleBuyer[] {
  const count = Math.min(5, 3 + (day % 3));
  return Array.from({ length: count }, (_, index) => ({
    id: `D${day}-BUYER-${index + 1}`,
    displayName: `今日买家 ${index + 1}`,
  }));
}

function createMockChallenge(day: number): VisibleDailyChallenge {
  const definition = CHALLENGES[day - 1] ?? CHALLENGES[0];
  const tasks: VisibleDailyChallengeTask[] = definition.taskPrompts.map(
    (prompt, taskIndex) => ({
      id: `day-${day}-task-${taskIndex + 1}`,
      prompt,
      selectionMode: "single",
      minSelections: 1,
      maxSelections: 1,
      options: definition.optionLabels.map((label, optionIndex) => ({
        id: `task-${taskIndex + 1}-option-${optionIndex + 1}`,
        label,
      })),
    }),
  );
  return {
    id: `DAY-${day}-CHALLENGE`,
    day,
    kind: definition.kind,
    title: definition.title,
    briefing: definition.briefing,
    objective: definition.objective,
    requiredApp: definition.requiredApp,
    choices: tasks[0]?.options ?? [],
    tasks,
    status: "active",
    feedback: null,
  };
}

function createMockMonologue(day: number): VisibleMonologue {
  return {
    title: `Day ${day} 工作日志`,
    speaker: "玩家记录",
    textSegments: [
      day === 1
        ? "第一天结束了。桌上的文件看起来没有变化，但它们已经有了买家。"
        : "昨日新闻把交易后果带回工位，黑箱又送来了新一批文件。",
      "这里是程序 A 的占位文案，正式文本由程序 C 经程序 B 可见状态传入。",
    ],
    closingCue: day >= 7 ? "查看最终报告" : "结束今天",
  };
}
