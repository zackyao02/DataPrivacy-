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
