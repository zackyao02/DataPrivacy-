export type VisibleRiskStatus = "normal" | "warning" | "critical";

export interface VisibleDataCard {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly sensitivity: "low" | "medium" | "high";
  readonly disabled?: boolean;
}

export interface VisibleProcessedPackage {
  readonly id: string;
  readonly label: string;
}

export interface VisibleBuyer {
  readonly id: string;
  readonly displayName: string;
}

export interface VisibleTransactionResult {
  readonly packageId: string | null;
  readonly buyerId: string | null;
  readonly status: "success" | "failed" | "pending";
  readonly summary: string;
}

export interface VisibleRiskLog {
  readonly id: string;
  readonly status: VisibleRiskStatus;
  readonly message: string;
}

export interface VisibleYesterdayNews {
  readonly title: string;
  readonly summary: string;
  readonly dateLabel: string;
}

export interface VisibleGameState {
  readonly day: number;
  readonly rawCards: readonly VisibleDataCard[];
  readonly operationPadCardId: string | null;
  readonly processedPackages: readonly VisibleProcessedPackage[];
  readonly workbench: {
    readonly slotCardIds: readonly (string | null)[];
  };
  readonly buyers: readonly VisibleBuyer[];
  readonly selectedPackageId: string | null;
  readonly selectedBuyerId: string | null;
  readonly lastTransactionResult: VisibleTransactionResult | null;
  readonly riskLogs: readonly VisibleRiskLog[];
  readonly consequenceSummary: string | null;
  readonly yesterdayNews: VisibleYesterdayNews | null;
  readonly riskStatus: VisibleRiskStatus;
  readonly monitor: {
    readonly desktopAvailable: boolean;
  };
  readonly ending: {
    readonly available: boolean;
  };
}

export const MOCK_VISIBLE_STATE: Readonly<VisibleGameState> =
  freezeVisibleGameState({
    day: 1,
    rawCards: [
      {
        id: "RAW-001",
        title: "访客登记片段",
        summary: "办公区访客时间与接待记录。",
        sensitivity: "low",
      },
      {
        id: "RAW-002",
        title: "账户重置记录",
        summary: "近期账户验证与重置请求摘要。",
        sensitivity: "medium",
      },
      {
        id: "RAW-003",
        title: "配送轨迹样本",
        summary: "多个收件地址与时间窗口。",
        sensitivity: "high",
      },
      {
        id: "RAW-004",
        title: "工位门禁摘要",
        summary: "楼层门禁刷卡与异常重试片段。",
        sensitivity: "low",
      },
      {
        id: "RAW-005",
        title: "设备连接快照",
        summary: "办公网络中的设备连接与活跃时段。",
        sensitivity: "medium",
      },
      {
        id: "RAW-006",
        title: "紧急联系人索引",
        summary: "账户资料中的联系人关系与更新记录。",
        sensitivity: "high",
        disabled: true,
      },
    ],
    operationPadCardId: null,
    processedPackages: [
      { id: "PKG-001", label: "通勤轨迹组合" },
      { id: "PKG-002", label: "账户行为摘要" },
      { id: "PKG-003", label: "访客关系图" },
    ],
    workbench: {
      slotCardIds: ["RAW-001", "RAW-002", null],
    },
    buyers: [
      { id: "BUYER-ALPHA", displayName: "灰桥咨询" },
      { id: "BUYER-BETA", displayName: "穹顶保险" },
      { id: "BUYER-GAMMA", displayName: "西区物流" },
    ],
    selectedPackageId: "PKG-002",
    selectedBuyerId: "BUYER-BETA",
    lastTransactionResult: {
      packageId: "PKG-001",
      buyerId: "BUYER-ALPHA",
      status: "success",
      summary: "上一笔交易已完成，风险记录已更新。",
    },
    riskLogs: [
      {
        id: "RISK-001",
        status: "normal",
        message: "基础审计记录已建立。",
      },
      {
        id: "RISK-002",
        status: "warning",
        message: "轨迹类数据触发额外关注。",
      },
      {
        id: "RISK-003",
        status: "warning",
        message: "买家关联度高于日常均值。",
      },
    ],
    consequenceSummary:
      "昨日数据交易后，旧城区相关服务出现了新的异常审查记录。",
    yesterdayNews: {
      title: "旧城区数据服务中心完成夜间维护",
      summary:
        "公司称维护期间未影响客户服务。附近居民则表示，凌晨仍能听见机房设备持续运转。",
      dateLabel: "昨日晨报 · 占位数据",
    },
    riskStatus: "warning",
    monitor: {
      desktopAvailable: true,
    },
    ending: {
      available: false,
    },
  });

export function freezeVisibleGameState(
  state: VisibleGameState,
): Readonly<VisibleGameState> {
  return Object.freeze({
    ...state,
    rawCards: Object.freeze(
      state.rawCards.map((card) => Object.freeze({ ...card })),
    ),
    processedPackages: Object.freeze(
      state.processedPackages.map((item) => Object.freeze({ ...item })),
    ),
    workbench: Object.freeze({
      slotCardIds: Object.freeze([...state.workbench.slotCardIds]),
    }),
    buyers: Object.freeze(
      state.buyers.map((buyer) => Object.freeze({ ...buyer })),
    ),
    lastTransactionResult: state.lastTransactionResult
      ? Object.freeze({ ...state.lastTransactionResult })
      : null,
    riskLogs: Object.freeze(
      state.riskLogs.map((log) => Object.freeze({ ...log })),
    ),
    yesterdayNews: state.yesterdayNews
      ? Object.freeze({ ...state.yesterdayNews })
      : null,
    monitor: Object.freeze({ ...state.monitor }),
    ending: Object.freeze({ ...state.ending }),
  });
}
