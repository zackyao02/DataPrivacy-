export type VisibleRiskStatus = "normal" | "warning" | "critical";

export interface VisibleRiskMetrics {
  readonly regulatory: number | null;
  readonly publicOpinion: number | null;
  readonly internalSuspicion: number | null;
}

export type VisibleDailyPhase =
  | "briefing"
  | "challenge"
  | "processing"
  | "trading"
  | "news"
  | "emotion"
  | "monologue"
  | "ending";

export type VisibleDailyChallengeKind =
  | "protocol-match"
  | "data-cleaning"
  | "public-opinion"
  | "profile-puzzle"
  | "buyer-negotiation"
  | "protocol-scan"
  | "final-package";

export interface VisibleDailyChoice {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface VisibleDailyChallengeTask {
  readonly id: string;
  readonly prompt: string;
  readonly selectionMode: "single" | "multiple";
  readonly minSelections: number;
  readonly maxSelections: number | null;
  readonly options: readonly VisibleDailyChoice[];
}

export interface VisibleDailyChallenge {
  readonly id: string;
  readonly day: number;
  readonly kind: VisibleDailyChallengeKind;
  readonly title: string;
  readonly briefing: string;
  readonly objective: string;
  readonly requiredApp: "data-processing" | "buyer-trade";
  readonly choices: readonly VisibleDailyChoice[];
  readonly tasks: readonly VisibleDailyChallengeTask[];
  readonly status: "ready" | "active" | "success" | "failed";
  readonly feedback: string | null;
}

export interface VisibleMonologue {
  readonly title: string;
  readonly speaker: string;
  readonly textSegments: readonly string[];
  readonly closingCue: string;
}

export interface VisibleDailyFlow {
  readonly phase: VisibleDailyPhase;
  readonly challenge: VisibleDailyChallenge | null;
  readonly blackBoxLine: string | null;
  readonly emotionPrompt: string | null;
  readonly monologue: VisibleMonologue | null;
}

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

export interface VisiblePackageCandidate {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
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

export interface VisibleArchiveEntry {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly day?: number;
  readonly status?: VisibleRiskStatus | "success" | "failed" | "pending";
}

export interface VisibleBadge {
  readonly id: string;
  readonly label: string;
  readonly unlocked: boolean;
}

export interface VisibleEndingReport {
  readonly title: string;
  readonly endingTitle: string;
  readonly endingBody: string;
  readonly rating: string;
  readonly literacyRating: string;
  readonly playerNickname: string;
  readonly days: number;
  readonly totalEarnings: number | null;
  readonly totalConscienceLost: number | null;
  readonly totalTransactions: number | null;
  readonly comment: string;
  readonly advice: string;
}

export interface VisibleGameState {
  readonly day: number;
  readonly clarityScore: number;
  readonly conscience: number;
  readonly dailyFlow: VisibleDailyFlow;
  readonly rawCards: readonly VisibleDataCard[];
  readonly operationPadCardId: string | null;
  readonly processedPackages: readonly VisibleProcessedPackage[];
  readonly packageCandidates: readonly VisiblePackageCandidate[];
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
  readonly operationLogs: readonly VisibleArchiveEntry[];
  readonly newsArchive: readonly VisibleYesterdayNews[];
  readonly blackBoxArchive: readonly VisibleArchiveEntry[];
  readonly monologueArchive: readonly VisibleArchiveEntry[];
  readonly badges: readonly VisibleBadge[];
  readonly riskStatus: VisibleRiskStatus;
  readonly riskMetrics: VisibleRiskMetrics;
  readonly monitor: {
    readonly desktopAvailable: boolean;
  };
  readonly ending: {
    readonly available: boolean;
    readonly report: VisibleEndingReport | null;
  };
}

export const MOCK_VISIBLE_STATE: Readonly<VisibleGameState> =
  freezeVisibleGameState({
    day: 1,
    clarityScore: 0,
    conscience: 0,
    dailyFlow: {
      phase: "processing",
      challenge: null,
      blackBoxLine: "Keep the line moving. Do not ask what the files become.",
      emotionPrompt: null,
      monologue: null,
    },
    rawCards: [
      {
        id: "RAW-001",
        title: "Commute Trail",
        summary: "Location pings across home, office, and night routes.",
        sensitivity: "high",
      },
      {
        id: "RAW-002",
        title: "Late Payment Pattern",
        summary: "Small credit failures and purchase timing fragments.",
        sensitivity: "medium",
      },
      {
        id: "RAW-003",
        title: "Contact Graph",
        summary: "Frequent calls and social links from one user cluster.",
        sensitivity: "high",
      },
      {
        id: "RAW-004",
        title: "Health Reminder Log",
        summary: "Medication reminders, sleep time, and step-count hints.",
        sensitivity: "high",
      },
      {
        id: "RAW-005",
        title: "Device Login Trace",
        summary: "Browser fingerprints and office network login windows.",
        sensitivity: "medium",
      },
    ],
    operationPadCardId: null,
    processedPackages: [
      { id: "PKG-001", label: "Route Bundle" },
      { id: "PKG-002", label: "Credit Profile" },
      { id: "PKG-003", label: "Contact Graph Pack" },
      { id: "PKG-004", label: "Health Signal Pack" },
      { id: "PKG-005", label: "Preference Pack" },
    ],
    packageCandidates: [],
    workbench: {
      slotCardIds: ["RAW-001", "RAW-002", null],
    },
    buyers: [
      { id: "BUYER-ALPHA", displayName: "Greybridge Consulting" },
      { id: "BUYER-BETA", displayName: "Rooftop Insurance" },
      { id: "BUYER-GAMMA", displayName: "West District Logistics" },
      { id: "BUYER-DELTA", displayName: "Signal Harvest Lab" },
      { id: "BUYER-EPSILON", displayName: "Bright Market Group" },
    ],
    selectedPackageId: "PKG-002",
    selectedBuyerId: "BUYER-BETA",
    lastTransactionResult: {
      packageId: "PKG-001",
      buyerId: "BUYER-ALPHA",
      status: "success",
      summary: "Last transaction sealed; tomorrow's paper is now available.",
    },
    riskLogs: [
      {
        id: "RISK-001",
        status: "normal",
        message: "Audit trail initialized.",
      },
      {
        id: "RISK-002",
        status: "warning",
        message: "Location data increased public exposure risk.",
      },
      {
        id: "RISK-003",
        status: "warning",
        message: "Buyer overlap detected in recent transactions.",
      },
      {
        id: "RISK-004",
        status: "critical",
        message: "High sensitivity package prepared for resale.",
      },
    ],
    consequenceSummary:
      "A local service report changed after yesterday's sale. Program B owns the final wording.",
    yesterdayNews: {
      title: "Old District Service Center Finishes Overnight Maintenance",
      summary:
        "The article should be generated from the previous day's sold package and buyer.",
      dateLabel: "Yesterday News",
    },
    operationLogs: [
      {
        id: "LOG-001",
        title: "Card moved",
        summary: "RAW-001 placed into slot 01.",
        day: 1,
        status: "pending",
      },
      {
        id: "LOG-002",
        title: "Package sealed",
        summary: "PKG-001 generated from three raw cards.",
        day: 1,
        status: "success",
      },
    ],
    newsArchive: [
      {
        title: "Old District Service Center Finishes Overnight Maintenance",
        summary: "Mock entry; Program C will provide final text.",
        dateLabel: "Day 2 Morning",
      },
    ],
    blackBoxArchive: [
      {
        id: "BB-001",
        title: "Black Box",
        summary: "Treat these as files, not people.",
        day: 1,
      },
    ],
    monologueArchive: [
      {
        id: "MONO-001",
        title: "End of Day 1",
        summary: "The player notices the work becoming easier to justify.",
        day: 1,
      },
    ],
    badges: [
      { id: "badge-first-seal", label: "First Seal", unlocked: true },
      { id: "badge-clear-signal", label: "Clear Signal", unlocked: false },
    ],
    riskStatus: "warning",
    riskMetrics: {
      regulatory: 42,
      publicOpinion: 55,
      internalSuspicion: 36,
    },
    monitor: {
      desktopAvailable: true,
    },
    ending: {
      available: false,
      report: null,
    },
  });

export function freezeVisibleGameState(
  state: VisibleGameState,
): Readonly<VisibleGameState> {
  return Object.freeze({
    ...state,
    dailyFlow: Object.freeze({
      ...state.dailyFlow,
      challenge: state.dailyFlow.challenge
        ? Object.freeze({
            ...state.dailyFlow.challenge,
            choices: Object.freeze(
              state.dailyFlow.challenge.choices.map((choice) =>
                Object.freeze({ ...choice }),
              ),
            ),
            tasks: Object.freeze(
              state.dailyFlow.challenge.tasks.map((task) =>
                Object.freeze({
                  ...task,
                  options: Object.freeze(
                    task.options.map((option) => Object.freeze({ ...option })),
                  ),
                }),
              ),
            ),
          })
        : null,
      monologue: state.dailyFlow.monologue
        ? Object.freeze({
            ...state.dailyFlow.monologue,
            textSegments: Object.freeze([
              ...state.dailyFlow.monologue.textSegments,
            ]),
          })
        : null,
    }),
    rawCards: Object.freeze(
      state.rawCards.map((card) => Object.freeze({ ...card })),
    ),
    processedPackages: Object.freeze(
      state.processedPackages.map((item) => Object.freeze({ ...item })),
    ),
    packageCandidates: Object.freeze(
      state.packageCandidates.map((item) => Object.freeze({ ...item })),
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
    operationLogs: Object.freeze(
      state.operationLogs.map((log) => Object.freeze({ ...log })),
    ),
    newsArchive: Object.freeze(
      state.newsArchive.map((news) => Object.freeze({ ...news })),
    ),
    blackBoxArchive: Object.freeze(
      state.blackBoxArchive.map((entry) => Object.freeze({ ...entry })),
    ),
    monologueArchive: Object.freeze(
      state.monologueArchive.map((entry) => Object.freeze({ ...entry })),
    ),
    badges: Object.freeze(
      state.badges.map((badge) => Object.freeze({ ...badge })),
    ),
    riskMetrics: Object.freeze({ ...state.riskMetrics }),
    monitor: Object.freeze({ ...state.monitor }),
    ending: Object.freeze({
      ...state.ending,
      report: state.ending.report
        ? Object.freeze({ ...state.ending.report })
        : null,
    }),
  });
}
