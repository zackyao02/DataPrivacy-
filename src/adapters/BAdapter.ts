import type {
  DailyChallengeResponse,
  GameCommandPort,
  GameEventListener,
  GameEventPort,
  GameStatePort,
} from "../game/GamePorts";
import type { SceneId } from "../core/types";
import {
  freezeVisibleGameState,
  type VisibleDataCard,
  type VisibleDailyFlow,
  type VisibleGameState,
  type VisibleEndingReport,
  type VisibleArchiveEntry,
  type VisibleBadge,
  type VisiblePackageCandidate,
  type VisibleRiskLog,
  type VisibleRiskStatus,
  type VisibleTransactionResult,
} from "../game/VisibleGameState";

export const PROGRAM_A_WORKBENCH_SLOT_COUNT = 3;

export const EMPTY_VISIBLE_GAME_STATE: Readonly<VisibleGameState> =
  freezeVisibleGameState({
    day: 1,
    clarityScore: 0,
    conscience: 100,
    dailyFlow: {
      phase: "briefing",
      challenge: null,
      blackBoxLine: null,
      emotionPrompt: null,
      monologue: null,
    },
    rawCards: [],
    operationPadCardId: null,
    processedPackages: [],
    packageCandidates: [],
    workbench: { slotCardIds: [null, null, null] },
    buyers: [],
    selectedPackageId: null,
    selectedBuyerId: null,
    lastTransactionResult: null,
    riskLogs: [],
    consequenceSummary: null,
    yesterdayNews: null,
    operationLogs: [],
    newsArchive: [],
    blackBoxArchive: [],
    monologueArchive: [],
    badges: [],
    riskStatus: "normal",
    riskMetrics: {
      regulatory: null,
      publicOpinion: null,
      internalSuspicion: null,
    },
    monitor: { desktopAvailable: true },
    ending: { available: false, report: null },
  });

export interface ProgramBAdapterPort
  extends GameStatePort,
    GameCommandPort,
    GameEventPort {
  setScene?(previousScene: SceneId, currentScene: SceneId): void;
  destroy(): void;
}

export interface ProgramBRawCard {
  readonly id?: string;
  readonly cardId?: string;
  readonly title?: string;
  readonly name?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly detail?: string;
  readonly sensitivity?: string;
  readonly disabled?: boolean;
  readonly status?: string;
}

export type ProgramBWorkbenchSlot =
  | string
  | null
  | undefined
  | { readonly id?: string | null; readonly cardId?: string | null };

export interface ProgramBPackage {
  readonly id?: string;
  readonly packageId?: string;
  readonly label?: string;
  readonly name?: string;
  readonly recipeName?: string;
  readonly isWaste?: boolean;
}

export interface ProgramBPackageCandidate {
  readonly id?: string;
  readonly recipeId?: string;
  readonly label?: string;
  readonly name?: string;
  readonly summary?: string;
  readonly description?: string;
}

export interface ProgramBBuyer {
  readonly id?: string;
  readonly buyerId?: string;
  readonly displayName?: string;
  readonly name?: string;
}

export interface ProgramBNews {
  readonly title?: string;
  readonly headline?: string;
  readonly summary?: string;
  readonly body?: string;
  readonly category?: string;
  readonly dateLabel?: string;
  readonly date?: string;
}

export interface ProgramBArchiveEntry {
  readonly id?: string;
  readonly title?: string;
  readonly label?: string;
  readonly summary?: string;
  readonly message?: string;
  readonly text?: string;
  readonly day?: number;
  readonly status?: string;
}

export interface ProgramBBadge {
  readonly id?: string;
  readonly badgeId?: string;
  readonly label?: string;
  readonly name?: string;
  readonly unlocked?: boolean;
}

export interface ProgramBRiskEntry {
  readonly id?: string;
  readonly status?: string;
  readonly message?: string;
  readonly summary?: string;
}

export type ProgramBRisk =
  | string
  | {
      readonly status?: string;
      readonly level?: string;
      readonly logs?: readonly ProgramBRiskEntry[];
      readonly history?: readonly ProgramBRiskEntry[];
      readonly consequenceSummary?: string | null;
      readonly regulatory?: number;
      readonly publicOpinion?: number;
      readonly internalSuspicion?: number;
    };

export interface ProgramBTransaction {
  readonly id?: string;
  readonly transactionId?: string;
  readonly packageId?: string | null;
  readonly buyerId?: string | null;
  readonly status?: string;
  readonly summary?: string;
  readonly message?: string;
  readonly riskStatus?: string;
  readonly riskContribution?: {
    readonly regulatory?: number;
    readonly publicOpinion?: number;
    readonly internalSuspicion?: number;
  };
}

export interface ProgramBDailyChallenge {
  readonly id?: string;
  readonly day?: number;
  readonly type?: string;
  readonly title?: string;
  readonly briefing?: string;
  readonly description?: string;
  readonly objective?: string;
  readonly prompt?: string;
  readonly choices?: readonly ProgramBDailyChoice[];
  readonly tasks?: readonly ProgramBDailyChallengeTask[];
}

export interface ProgramBDailyChallengeTask {
  readonly id?: string;
  readonly prompt?: string;
  readonly selectionMode?: "single" | "multiple";
  readonly minSelections?: number;
  readonly maxSelections?: number | null;
  readonly options?: readonly ProgramBDailyChoice[];
}

export interface ProgramBDailyChoice {
  readonly id?: string;
  readonly label?: string;
  readonly text?: string;
  readonly description?: string;
}

export interface ProgramBActiveChallenge {
  readonly status?: string;
  readonly passed?: boolean;
  readonly completed?: boolean;
  readonly skipped?: boolean;
  readonly lastResult?: {
    readonly message?: string;
    readonly feedback?: string;
  } | null;
}

export interface ProgramBDailyEmotion {
  readonly required?: boolean;
  readonly resolved?: boolean;
  readonly feedback?: string;
}

export interface ProgramBDailyMonologue {
  readonly title?: string;
  readonly speaker?: string;
  readonly text?: string;
  readonly body?: string;
  readonly textSegments?: readonly string[];
  readonly closingCue?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface ProgramBEndingReport {
  readonly title?: string;
  readonly endingTitle?: string;
  readonly endingBody?: string;
  readonly rating?: string;
  readonly literacyRating?: string;
  readonly playerNickname?: string;
  readonly days?: number;
  readonly dayReached?: number;
  readonly totalEarnings?: number;
  readonly totalConscienceLost?: number;
  readonly totalTxs?: number;
  readonly transactionCount?: number;
  readonly comment?: string;
  readonly advice?: string;
}

export interface ProgramBBlackBoxDialogue {
  readonly text?: string;
  readonly briefing?: string;
  readonly instruction?: string;
  readonly success?: string;
  readonly summary?: string;
  readonly lowBriefing?: string;
  readonly highBriefing?: string;
}

export interface ProgramBStateContract {
  readonly day?: number;
  readonly conscience?: number;
  readonly clarity_score?: number;
  readonly dailyFlow?: VisibleDailyFlow;
  readonly dailyChallenge?: ProgramBDailyChallenge | null;
  readonly activeChallenge?: ProgramBActiveChallenge | null;
  readonly dailyEmotion?: ProgramBDailyEmotion | null;
  readonly dailyMonologue?: ProgramBDailyMonologue | string | null;
  readonly blackboxDialogue?: string | ProgramBBlackBoxDialogue | null;
  readonly rawCards?: readonly ProgramBRawCard[];
  readonly workbench?: readonly ProgramBWorkbenchSlot[];
  readonly packageInventory?: readonly ProgramBPackage[];
  readonly buyers?: readonly ProgramBBuyer[];
  readonly dailyNews?: ProgramBNews | null;
  readonly news_seen?: readonly ProgramBNews[];
  readonly newsArchive?: readonly ProgramBNews[];
  readonly risk?: ProgramBRisk;
  readonly transactions?: readonly ProgramBTransaction[];
  readonly sold_log?: readonly ProgramBTransaction[];
  readonly operationLogs?: readonly ProgramBArchiveEntry[];
  readonly blackBoxArchive?: readonly ProgramBArchiveEntry[];
  readonly monologueArchive?: readonly ProgramBArchiveEntry[];
  readonly badges?: readonly ProgramBBadge[];
  readonly selectedPackageId?: string | null;
  readonly selectedBuyerId?: string | null;
  readonly monitorAvailable?: boolean;
  readonly endingAvailable?: boolean;
  readonly endingTriggered?: boolean;
  readonly ending_report?: ProgramBEndingReport | null;
  readonly endingRoute?: string | null;
  readonly isGameOver?: boolean;
  readonly gameOverReason?: string | null;
  readonly operationPadCardId?: string | null;
}

export interface ProgramBOperationOutcome {
  readonly ok?: boolean;
  readonly code?: string;
  readonly message?: string;
  readonly package?: ProgramBPackage;
  readonly candidates?: readonly ProgramBPackageCandidate[];
  readonly transaction?: ProgramBTransaction;
  readonly isWaste?: boolean;
}

export type ProgramBOperationResult<TState> =
  | TState
  | ProgramBOperationOutcome
  | void;

export interface ProgramBBindings<TState extends ProgramBStateContract> {
  getState(): TState;
  setState?(state: TState): void;
  resolveStateResult?(result: ProgramBOperationResult<TState>): TState | undefined;
  onStateChange?(listener: (state: Readonly<TState>) => void): () => void;
  onGameEvent?(listener: GameEventListener): () => void;
  submitCardToOperationPad?(
    gameState: TState,
    cardId: string,
  ): ProgramBOperationResult<TState>;
  placeCardToSlot(
    gameState: TState,
    cardId: string,
    slotIndex: number,
  ): ProgramBOperationResult<TState>;
  removeCardFromSlot(
    gameState: TState,
    slotIndex: number,
  ): ProgramBOperationResult<TState>;
  createPackage(
    gameState: TState,
    preferredRecipeId?: string,
  ): ProgramBOperationResult<TState>;
  sellPackage(
    gameState: TState,
    packageId: string,
    buyerId: string,
  ): ProgramBOperationResult<TState>;
  submitDailyChallengeChoice?(
    gameState: TState,
    challengeId: string,
    choiceId: string,
  ): ProgramBOperationResult<TState>;
  submitDailyChallenge?(
    gameState: TState,
    challengeId: string,
    response: DailyChallengeResponse,
  ): ProgramBOperationResult<TState>;
  selectEmotion?(
    gameState: TState,
    emotion: "empathy" | "anger" | "numbness",
  ): ProgramBOperationResult<TState>;
  advanceDailyPhase?(
    gameState: TState,
  ): ProgramBOperationResult<TState>;
}

export class BAdapter<TState extends ProgramBStateContract>
  implements ProgramBAdapterPort
{
  private visibleState: Readonly<VisibleGameState>;
  private readonly stateListeners = new Set<
    (state: Readonly<VisibleGameState>) => void
  >();
  private readonly eventListeners = new Set<GameEventListener>();
  private readonly stopStateSubscription?: () => void;
  private readonly stopEventSubscription?: () => void;

  constructor(
    private readonly bindings: ProgramBBindings<TState>,
    fallback: Readonly<VisibleGameState> = EMPTY_VISIBLE_GAME_STATE,
  ) {
    this.visibleState = mapProgramBStateToVisibleState(
      bindings.getState(),
      fallback,
    );
    this.stopStateSubscription = bindings.onStateChange?.((state) => {
      this.publishState(mapProgramBStateToVisibleState(state, this.visibleState));
    });
    this.stopEventSubscription = bindings.onGameEvent?.((event) => {
      this.eventListeners.forEach((listener) => listener(event));
    });
  }

  getVisibleState(): Readonly<VisibleGameState> {
    return this.visibleState;
  }

  onVisibleStateChange(
    listener: (state: Readonly<VisibleGameState>) => void,
  ): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onGameEvent(listener: GameEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  submitCardToOperationPad(cardId: string): void {
    const result = this.bindings.submitCardToOperationPad
      ? this.invoke((state) =>
          this.bindings.submitCardToOperationPad?.(state, cardId),
        )
      : undefined;

    if (!didOperationSucceed(result)) {
      return;
    }

    this.publishState(
      freezeVisibleGameState({
        ...this.visibleState,
        operationPadCardId: cardId,
      }),
    );
    this.emitFallbackEvent("cardSubmittedToOperationPad", { cardId });
  }

  placeCardToSlot(cardId: string, slotIndex: number): void {
    if (!isProgramAWorkbenchSlot(slotIndex)) {
      return;
    }
    const result = this.invoke((state) =>
      this.bindings.placeCardToSlot(state, cardId, slotIndex),
    );

    if (didOperationSucceed(result)) {
      this.clearPackageCandidates();
      this.emitFallbackEvent("cardMovedToSlot", { cardId, slotIndex });
    }
  }

  removeCardFromSlot(slotIndex: number): void {
    if (!isProgramAWorkbenchSlot(slotIndex)) {
      return;
    }
    const result = this.invoke((state) =>
      this.bindings.removeCardFromSlot(state, slotIndex),
    );
    if (didOperationSucceed(result)) {
      this.clearPackageCandidates();
    }
  }

  createPackage(preferredRecipeId?: string): void {
    const result = this.invoke((state) =>
      this.bindings.createPackage(state, preferredRecipeId),
    );
    const outcome = getOperationOutcome(result);

    if (!didOperationSucceed(result)) {
      const candidates = mapPackageCandidates(outcome?.candidates ?? []);
      if (candidates.length > 0) {
        this.publishState(
          freezeVisibleGameState({
            ...this.visibleState,
            packageCandidates: candidates,
          }),
        );
        this.emitAdapterEvent("packageChoiceRequired", {
          code: outcome?.code,
          message: outcome?.message ?? "该组合可生成多个数据包，请选择配方。",
          candidates,
        });
        return;
      }
      this.emitAdapterEvent("packageWasted", {
        code: outcome?.code,
        message: outcome?.message ?? "当前组合无法完成封装。",
      });
      return;
    }

    this.clearPackageCandidates();

    if (outcome?.isWaste || outcome?.package?.isWaste) {
      this.emitFallbackEvent("wasteCreated", {
        packageId: getPackageId(outcome.package),
        message: outcome.message,
      });
      return;
    }

    const packageId = getPackageId(outcome?.package);
    if (this.visibleState.dailyFlow.phase === "processing") {
      this.patchDailyPhase("trading");
    }
    this.emitFallbackEvent("packageCreated", {
      packageId,
      message: outcome?.message,
    });
    this.emitFallbackEvent("packageSealed", { packageId });
  }

  selectPackage(packageId: string): void {
    this.publishState(
      freezeVisibleGameState({
        ...this.visibleState,
        selectedPackageId: packageId,
      }),
    );
  }

  selectBuyer(buyerId: string): void {
    this.publishState(
      freezeVisibleGameState({
        ...this.visibleState,
        selectedBuyerId: buyerId,
      }),
    );
  }

  submitTransaction(packageId: string, buyerId: string): void {
    const previousRiskStatus = this.visibleState.riskStatus;
    const result = this.invoke((state) =>
      this.bindings.sellPackage(state, packageId, buyerId),
    );
    const outcome = getOperationOutcome(result);

    if (!didOperationSucceed(result)) {
      this.emitFallbackEvent("transactionFailed", {
        packageId,
        buyerId,
        message: outcome?.message,
      });
      return;
    }

    if (this.visibleState.dailyFlow.phase === "trading") {
      this.patchDailyPhase("monologue");
    }

    this.emitFallbackEvent("transactionSuccess", {
      packageId,
      buyerId,
      message: outcome?.message,
    });
    this.emitFallbackEvent("transactionSealed", { packageId, buyerId });

    if (this.visibleState.riskStatus !== previousRiskStatus) {
      this.emitFallbackEvent("riskChanged", {
        previousStatus: previousRiskStatus,
        riskStatus: this.visibleState.riskStatus,
      });
    }
  }

  submitDailyChallengeChoice(challengeId: string, choiceId: string): void {
    const challenge = this.visibleState.dailyFlow.challenge;
    if (challenge) {
      this.submitDailyChallenge(challengeId, {
        kind: challenge.kind,
        answers: [{ taskId: challenge.tasks[0]?.id ?? "choice", optionIds: [choiceId] }],
      });
      return;
    }
    if (!this.bindings.submitDailyChallengeChoice) {
      return;
    }
    const result = this.invoke((state) =>
      this.bindings.submitDailyChallengeChoice?.(
        state,
        challengeId,
        choiceId,
      ),
    );
    const outcome = getOperationOutcome(result);
    this.emitFallbackEvent(
      didOperationSucceed(result) ? "challengeSuccess" : "challengeFail",
      { challengeId, choiceId, message: outcome?.message },
    );
  }

  submitDailyChallenge(
    challengeId: string,
    response: DailyChallengeResponse,
  ): void {
    const result = this.bindings.submitDailyChallenge
      ? this.invoke((state) =>
          this.bindings.submitDailyChallenge?.(state, challengeId, response),
        )
      : this.bindings.submitDailyChallengeChoice &&
          response.answers.length === 1 &&
          response.answers[0].optionIds.length === 1
        ? this.invoke((state) =>
            this.bindings.submitDailyChallengeChoice?.(
              state,
              challengeId,
              response.answers[0].optionIds[0],
            ),
          )
        : undefined;
    if (result === undefined) {
      this.emitAdapterEvent("challengeFail", {
        challengeId,
        message: "程序 B 尚未接入此关卡的结构化答案接口。",
      });
      return;
    }
    const outcome = getOperationOutcome(result);
    this.emitFallbackEvent(
      didOperationSucceed(result) ? "challengeSuccess" : "challengeFail",
      { challengeId, response, message: outcome?.message },
    );
  }

  selectEmotion(emotion: "empathy" | "anger" | "numbness"): void {
    if (!this.bindings.selectEmotion) {
      return;
    }
    const result = this.invoke((state) =>
      this.bindings.selectEmotion?.(state, emotion),
    );
    if (!didOperationSucceed(result)) {
      return;
    }
    this.patchDailyPhase(this.visibleState.day === 7 ? "challenge" : "briefing");
    this.emitFallbackEvent("emotionSelected", { emotion });
    this.emitFallbackEvent(
      emotion === "empathy"
        ? "emotionEmpathySelected"
        : emotion === "anger"
          ? "emotionAngerSelected"
          : "emotionNumbnessSelected",
      { emotion },
    );
  }

  advanceDailyPhase(): void {
    const flow = this.visibleState.dailyFlow;

    if (flow.phase === "briefing") {
      this.patchDailyPhase(flow.challenge ? "challenge" : "processing");
      return;
    }

    if (flow.phase === "challenge") {
      if (
        flow.challenge?.status === "success" ||
        flow.challenge?.status === "failed"
      ) {
        this.patchDailyPhase("processing");
      }
      return;
    }

    if (flow.phase === "news") {
      this.patchDailyPhase(
        this.visibleState.day === 7
          ? "briefing"
          : this.hasPendingEmotion()
            ? "emotion"
            : "briefing",
      );
      return;
    }

    if (flow.phase === "emotion" || flow.phase === "ending") {
      return;
    }

    if (flow.phase !== "monologue" || !this.bindings.advanceDailyPhase) {
      return;
    }

    const previousDay = this.visibleState.day;
    this.invoke((state) => this.bindings.advanceDailyPhase?.(state));

    if (this.visibleState.ending.available) {
      this.patchDailyPhase("ending");
    } else if (this.visibleState.day !== previousDay) {
      this.patchDailyPhase("news");
    }
  }

  refresh(): Readonly<VisibleGameState> {
    const next = mapProgramBStateToVisibleState(
      this.bindings.getState(),
      this.visibleState,
    );
    this.publishState(next);
    return next;
  }

  destroy(): void {
    this.stopStateSubscription?.();
    this.stopEventSubscription?.();
    this.stateListeners.clear();
    this.eventListeners.clear();
  }

  private invoke(
    operation: (state: TState) => ProgramBOperationResult<TState>,
  ): ProgramBOperationResult<TState> {
    const result = operation(this.bindings.getState());

    const returnedState = this.bindings.resolveStateResult?.(result);

    if (returnedState !== undefined) {
      this.bindings.setState?.(returnedState);
    }

    this.refresh();
    return result;
  }

  private emitFallbackEvent(type: string, payload?: unknown): void {
    if (this.bindings.onGameEvent) {
      return;
    }

    this.emitAdapterEvent(type, payload);
  }

  private emitAdapterEvent(type: string, payload?: unknown): void {
    const event = {
      type,
      payload,
      timestamp: Date.now(),
    };
    this.eventListeners.forEach((listener) => listener(event));
  }

  private clearPackageCandidates(): void {
    if (this.visibleState.packageCandidates.length === 0) {
      return;
    }
    this.publishState(
      freezeVisibleGameState({
        ...this.visibleState,
        packageCandidates: [],
      }),
    );
  }

  private patchDailyPhase(phase: VisibleDailyFlow["phase"]): void {
    if (this.visibleState.dailyFlow.phase === phase) {
      return;
    }

    this.publishState(
      freezeVisibleGameState({
        ...this.visibleState,
        dailyFlow: {
          ...this.visibleState.dailyFlow,
          phase,
        },
      }),
    );
  }

  private hasPendingEmotion(): boolean {
    const state = this.bindings.getState();
    return state.dailyEmotion?.required === true && state.dailyEmotion.resolved !== true;
  }

  private publishState(state: Readonly<VisibleGameState>): void {
    this.visibleState = state;
    this.stateListeners.forEach((listener) => listener(state));
  }
}

export function mapProgramBStateToVisibleState(
  state: Readonly<ProgramBStateContract>,
  fallback: Readonly<VisibleGameState> = EMPTY_VISIBLE_GAME_STATE,
): Readonly<VisibleGameState> {
  const transactions = state.transactions ?? [];
  const soldLog = state.sold_log ?? [];
  const allTransactions = [...transactions, ...soldLog];
  const latestTransaction = allTransactions.at(-1);
  const riskStatus = mapRiskStatus(state.risk, fallback.riskStatus);
  const riskEntries =
    typeof state.risk === "object"
      ? [...(state.risk.logs ?? []), ...(state.risk.history ?? [])]
      : [];
  const clarityScore =
    typeof state.clarity_score === "number"
      ? Math.max(-6, Math.min(12, state.clarity_score))
      : fallback.clarityScore;

  return freezeVisibleGameState({
    day: state.day ?? fallback.day,
    clarityScore,
    conscience:
      typeof state.conscience === "number"
        ? Math.max(0, Math.min(100, state.conscience))
        : typeof state.clarity_score === "number"
          ? Math.round(((clarityScore + 6) / 18) * 100)
        : fallback.conscience,
    dailyFlow: mapDailyFlow(state, fallback.dailyFlow),
    rawCards: (state.rawCards ?? fallback.rawCards)
      .slice(0, 8)
      .map(mapRawCard),
    operationPadCardId:
      state.operationPadCardId !== undefined
        ? state.operationPadCardId
        : fallback.operationPadCardId,
    processedPackages: (state.packageInventory ?? fallback.processedPackages)
      .filter((item) => !("isWaste" in item && item.isWaste))
      .slice(0, 6)
      .map((item, index) => ({
        id:
          item.id ??
          ("packageId" in item ? item.packageId : undefined) ??
          `PACKAGE-${index + 1}`,
        label:
          item.label ??
          ("name" in item ? item.name : undefined) ??
          ("recipeName" in item ? item.recipeName : undefined) ??
          "未命名数据包",
      })),
    packageCandidates: fallback.packageCandidates,
    workbench: {
      slotCardIds: Array.from(
        { length: PROGRAM_A_WORKBENCH_SLOT_COUNT },
        (_, index) =>
          mapWorkbenchSlot(
            state.workbench?.[index] ?? fallback.workbench.slotCardIds[index],
          ),
      ),
    },
    buyers: (state.buyers ?? fallback.buyers).slice(0, 5).map((buyer, index) => ({
      id:
        buyer.id ??
        ("buyerId" in buyer ? buyer.buyerId : undefined) ??
        `BUYER-${index + 1}`,
      displayName:
        buyer.displayName ??
        ("name" in buyer ? buyer.name : undefined) ??
        "未命名买家",
    })),
    selectedPackageId:
      state.selectedPackageId !== undefined
        ? state.selectedPackageId
        : fallback.selectedPackageId,
    selectedBuyerId:
      state.selectedBuyerId !== undefined
        ? state.selectedBuyerId
        : fallback.selectedBuyerId,
    lastTransactionResult:
      state.transactions === undefined && state.sold_log === undefined
        ? fallback.lastTransactionResult
        : latestTransaction
          ? mapTransaction(latestTransaction)
          : null,
    riskLogs:
      state.risk === undefined &&
      state.transactions === undefined &&
      state.sold_log === undefined
        ? fallback.riskLogs
        : mapRiskLogs(riskEntries, allTransactions, riskStatus),
    consequenceSummary:
      (typeof state.risk === "object"
        ? state.risk.consequenceSummary
        : null) ??
      summarizeNumericRisk(state.risk) ??
      fallback.consequenceSummary,
    yesterdayNews:
      state.dailyNews === undefined
        ? fallback.yesterdayNews
        : state.dailyNews
          ? {
              title:
                state.dailyNews.title ??
                state.dailyNews.headline ??
                "未提供新闻标题",
              summary:
                state.dailyNews.summary ??
                state.dailyNews.body ??
                "未提供新闻摘要",
              dateLabel:
                state.dailyNews.dateLabel ??
                state.dailyNews.date ??
                "昨日新闻",
          }
          : null,
    operationLogs:
      state.operationLogs === undefined && state.sold_log === undefined
        ? fallback.operationLogs
        : [
            ...mapArchiveEntries(state.operationLogs ?? [], "LOG"),
            ...soldLog.map(mapTransactionArchiveEntry),
          ].slice(-12).reverse(),
    newsArchive:
      state.newsArchive === undefined && state.news_seen === undefined
        ? fallback.newsArchive
        : (state.newsArchive ?? state.news_seen ?? []).slice(-7).map(mapNews),
    blackBoxArchive:
      state.blackBoxArchive === undefined
        ? fallback.blackBoxArchive
        : mapArchiveEntries(state.blackBoxArchive, "BLACKBOX").slice(-12),
    monologueArchive:
      state.monologueArchive === undefined
        ? fallback.monologueArchive
        : mapArchiveEntries(state.monologueArchive, "MONOLOGUE").slice(-7),
    badges:
      state.badges === undefined
        ? fallback.badges
        : state.badges.map(mapBadge),
    riskStatus,
    riskMetrics: mapRiskMetrics(state.risk, fallback.riskMetrics),
    monitor: {
      desktopAvailable:
        state.monitorAvailable ?? fallback.monitor.desktopAvailable,
    },
    ending: {
      available:
        state.endingAvailable ??
        state.endingTriggered ??
        (state.ending_report
          ? true
          : (state.isGameOver ?? fallback.ending.available)),
      report:
        state.ending_report === undefined
          ? fallback.ending.report
          : mapEndingReport(state.ending_report),
    },
  });
}

function mapDailyFlow(
  state: Readonly<ProgramBStateContract>,
  fallback: VisibleDailyFlow,
): VisibleDailyFlow {
  if (state.dailyFlow) {
    return state.dailyFlow;
  }

  const phase = inferInitialDailyPhase(state, fallback);

  return {
    ...fallback,
    phase,
    challenge: state.dailyChallenge
      ? mapDailyChallenge(state.dailyChallenge, state.activeChallenge, state.day)
      : fallback.challenge,
    blackBoxLine: mapBlackBoxLine(
      state.blackboxDialogue,
      phase,
      state.endingRoute,
      fallback.blackBoxLine,
    ),
    emotionPrompt:
      state.dailyEmotion?.required && !state.dailyEmotion.resolved
        ? state.dailyEmotion.feedback ?? fallback.emotionPrompt
        : fallback.emotionPrompt,
    monologue:
      state.dailyMonologue === undefined
        ? fallback.monologue
        : mapDailyMonologue(state.dailyMonologue),
  };
}

function inferInitialDailyPhase(
  state: Readonly<ProgramBStateContract>,
  fallback: VisibleDailyFlow,
): VisibleDailyFlow["phase"] {
  if (
    state.endingAvailable ||
    state.endingTriggered ||
    state.ending_report ||
    state.isGameOver
  ) {
    return "ending";
  }

  if (fallback.challenge || fallback.phase !== "briefing") {
    return fallback.phase;
  }

  if (state.activeChallenge?.completed) {
    return "processing";
  }

  return state.dailyChallenge ? "briefing" : "processing";
}

function mapDailyChallenge(
  challenge: ProgramBDailyChallenge,
  active: ProgramBActiveChallenge | null | undefined,
  stateDay: number | undefined,
): NonNullable<VisibleDailyFlow["challenge"]> {
  const day = challenge.day ?? stateDay ?? 1;
  const kind = mapChallengeKind(challenge.type, day);
  const status = active?.completed
    ? active.passed
      ? "success"
      : "failed"
    : active?.status === "pending"
      ? "active"
      : "ready";
  const legacyChoices = (challenge.choices ?? []).map((choice, index) => ({
    id: choice.id ?? `choice-${index + 1}`,
    label: choice.label ?? choice.text ?? `Choice ${index + 1}`,
    description: choice.description,
  }));
  const tasks = (challenge.tasks ?? []).map((task, taskIndex) => ({
    id: task.id ?? `task-${taskIndex + 1}`,
    prompt: task.prompt ?? challenge.objective ?? challenge.prompt ?? "",
    selectionMode: task.selectionMode ?? "single",
    minSelections: Math.max(0, task.minSelections ?? 1),
    maxSelections:
      task.maxSelections === undefined ? 1 : task.maxSelections,
    options: (task.options ?? []).map((choice, optionIndex) => ({
      id: choice.id ?? `option-${optionIndex + 1}`,
      label: choice.label ?? choice.text ?? `Option ${optionIndex + 1}`,
      description: choice.description,
    })),
  }));

  return {
    id: challenge.id ?? `DAY-${day}-CHALLENGE`,
    day,
    kind,
    title: challenge.title ?? `Day ${day}`,
    briefing: challenge.briefing ?? challenge.description ?? "",
    objective: challenge.objective ?? challenge.prompt ?? "",
    requiredApp: kind === "buyer-negotiation" ? "buyer-trade" : "data-processing",
    choices: legacyChoices,
    tasks:
      tasks.length > 0
        ? tasks
        : legacyChoices.length > 0
          ? [{
              id: "choice",
              prompt: challenge.objective ?? challenge.prompt ?? "",
              selectionMode: "single",
              minSelections: 1,
              maxSelections: 1,
              options: legacyChoices,
            }]
          : [],
    status,
    feedback:
      active?.lastResult?.feedback ?? active?.lastResult?.message ?? null,
  };
}

function mapChallengeKind(
  type: string | undefined,
  day: number,
): NonNullable<VisibleDailyFlow["challenge"]>["kind"] {
  const byType = {
    protocol_disguise: "protocol-match",
    protocol_match: "protocol-match",
    data_cleaning: "data-cleaning",
    public_opinion: "public-opinion",
    profile_puzzle: "profile-puzzle",
    buyer_negotiation: "buyer-negotiation",
    protocol_scan: "protocol-scan",
    evidence_chain: "final-package",
  } as const;
  if (type && type in byType) {
    return byType[type as keyof typeof byType];
  }
  return (
    [
      "protocol-match",
      "data-cleaning",
      "public-opinion",
      "profile-puzzle",
      "buyer-negotiation",
      "protocol-scan",
      "final-package",
    ] as const
  )[Math.max(0, Math.min(6, day - 1))];
}

function mapBlackBoxLine(
  dialogue: ProgramBStateContract["blackboxDialogue"],
  phase: VisibleDailyFlow["phase"],
  endingRoute: string | null | undefined,
  fallback: string | null,
): string | null {
  if (!dialogue) {
    return fallback;
  }
  if (typeof dialogue === "string") {
    return dialogue;
  }
  if (dialogue.text) {
    return dialogue.text;
  }
  if (phase === "ending") {
    return endingRoute === "evidence_chain"
      ? dialogue.highBriefing ?? dialogue.lowBriefing ?? fallback
      : dialogue.lowBriefing ?? dialogue.highBriefing ?? fallback;
  }
  if (phase === "briefing") {
    return dialogue.briefing ?? fallback;
  }
  if (phase === "challenge" || phase === "processing") {
    return dialogue.instruction ?? dialogue.briefing ?? fallback;
  }
  if (phase === "trading") {
    return dialogue.success ?? dialogue.instruction ?? fallback;
  }
  return dialogue.summary ?? dialogue.success ?? fallback;
}

function mapDailyMonologue(
  monologue: ProgramBDailyMonologue | string | null,
): VisibleDailyFlow["monologue"] {
  if (!monologue) {
    return null;
  }
  if (typeof monologue === "string") {
    return {
      title: "Daily monologue",
      speaker: "PLAYER",
      textSegments: [monologue],
      closingCue: "Continue",
    };
  }
  const text = monologue.text ?? monologue.body;
  const legacySegments = [monologue.start, monologue.end].filter(
    (segment): segment is string => Boolean(segment),
  );
  return {
    title: monologue.title ?? "Daily monologue",
    speaker: monologue.speaker ?? "PLAYER",
    textSegments:
      monologue.textSegments ?? (text ? [text] : legacySegments),
    closingCue: monologue.closingCue ?? "Continue",
  };
}

function mapNews(news: ProgramBNews): VisibleGameState["newsArchive"][number] {
  return {
    title: news.title ?? news.headline ?? "Untitled news",
    summary: news.summary ?? news.body ?? "No news summary provided.",
    dateLabel: news.dateLabel ?? news.date ?? "Yesterday News",
  };
}

function mapArchiveEntries(
  entries: readonly ProgramBArchiveEntry[],
  fallbackPrefix: string,
): readonly VisibleArchiveEntry[] {
  return entries.map((entry, index) => ({
    id: entry.id ?? `${fallbackPrefix}-${index + 1}`,
    title: entry.title ?? entry.label ?? `${fallbackPrefix} ${index + 1}`,
    summary:
      entry.summary ??
      entry.message ??
      entry.text ??
      "No archive content provided.",
    day: entry.day,
    status: normalizeArchiveStatus(entry.status),
  }));
}

function mapTransactionArchiveEntry(
  transaction: ProgramBTransaction,
  index: number,
): VisibleArchiveEntry {
  return {
    id:
      transaction.id ??
      transaction.transactionId ??
      `SOLD-${index + 1}`,
    title: "Sold package",
    summary:
      transaction.summary ??
      transaction.message ??
      `${transaction.packageId ?? "-"} -> ${transaction.buyerId ?? "-"}`,
    status: normalizeTransactionStatus(transaction.status, "success"),
  };
}

function mapBadge(badge: ProgramBBadge, index: number): VisibleBadge {
  return {
    id: badge.id ?? badge.badgeId ?? `BADGE-${index + 1}`,
    label: badge.label ?? badge.name ?? `Badge ${index + 1}`,
    unlocked: badge.unlocked === true,
  };
}

function mapEndingReport(
  report: ProgramBEndingReport | null,
): VisibleEndingReport | null {
  if (!report) {
    return null;
  }
  return {
    title: report.title ?? "七日工作报告",
    endingTitle: report.endingTitle ?? "流程结束",
    endingBody: report.endingBody ?? "程序 B 未提供结局正文。",
    rating: report.rating ?? "未评级",
    literacyRating: report.literacyRating ?? "未评级",
    playerNickname: report.playerNickname ?? "匿名员工",
    days: report.days ?? report.dayReached ?? 7,
    totalEarnings:
      typeof report.totalEarnings === "number" ? report.totalEarnings : null,
    totalConscienceLost:
      typeof report.totalConscienceLost === "number"
        ? report.totalConscienceLost
        : null,
    totalTransactions:
      typeof report.totalTxs === "number"
        ? report.totalTxs
        : typeof report.transactionCount === "number"
          ? report.transactionCount
          : null,
    comment: report.comment ?? "",
    advice: report.advice ?? "",
  };
}

function mapPackageCandidates(
  candidates: readonly ProgramBPackageCandidate[],
): readonly VisiblePackageCandidate[] {
  return candidates.slice(0, 3).map((candidate, index) => ({
    id: candidate.id ?? candidate.recipeId ?? `RECIPE-${index + 1}`,
    label: candidate.label ?? candidate.name ?? `候选配方 ${index + 1}`,
    summary:
      candidate.summary ?? candidate.description ?? "程序 B 未提供配方说明。",
  }));
}

function mapRawCard(card: ProgramBRawCard, index: number): VisibleDataCard {
  return {
    id: card.id ?? card.cardId ?? `RAW-${index + 1}`,
    title: card.title ?? card.name ?? "未提供标题",
    summary:
      card.summary ?? card.description ?? card.detail ?? "未提供摘要",
    sensitivity: normalizeSensitivity(card.sensitivity),
    disabled:
      card.disabled ??
      (card.status !== undefined && card.status.toLowerCase() !== "available"),
  };
}

function mapWorkbenchSlot(slot: ProgramBWorkbenchSlot): string | null {
  if (typeof slot === "string") {
    return slot;
  }
  return slot?.cardId ?? slot?.id ?? null;
}

function mapTransaction(
  transaction: ProgramBTransaction,
): VisibleTransactionResult {
  return {
    packageId: transaction.packageId ?? null,
    buyerId: transaction.buyerId ?? null,
    status: normalizeTransactionStatus(transaction.status, "success"),
    summary:
      transaction.summary ?? transaction.message ?? "程序 B 未提供交易摘要。",
  };
}

function mapRiskLogs(
  riskEntries: readonly ProgramBRiskEntry[],
  transactions: readonly ProgramBTransaction[],
  fallbackStatus: VisibleRiskStatus,
): readonly VisibleRiskLog[] {
  const logs: VisibleRiskLog[] = riskEntries.map((entry, index) => ({
    id: entry.id ?? `RISK-${index + 1}`,
    status: normalizeRiskStatus(entry.status, fallbackStatus),
    message: entry.message ?? entry.summary ?? "程序 B 未提供风险日志内容。",
  }));

  transactions.forEach((transaction, index) => {
    logs.push({
      id:
        transaction.id ??
        transaction.transactionId ??
        `TRANSACTION-${index + 1}`,
      status: transaction.riskStatus
        ? normalizeRiskStatus(transaction.riskStatus, fallbackStatus)
        : mapRiskStatus(transaction.riskContribution, fallbackStatus),
      message:
        transaction.summary ??
        transaction.message ??
        `交易 ${transaction.packageId ?? "-"} → ${transaction.buyerId ?? "-"}`,
    });
  });

  if (logs.length === 0) {
    logs.push({
      id: "RISK-CURRENT",
      status: fallbackStatus,
      message: `当前风险状态：${fallbackStatus}`,
    });
  }

  return logs.slice(-4).reverse();
}

function normalizeSensitivity(
  value: string | undefined,
): VisibleDataCard["sensitivity"] {
  return value === "medium" || value === "high" ? value : "low";
}

function normalizeRiskStatus(
  value: string | undefined,
  fallback: VisibleRiskStatus,
): VisibleRiskStatus {
  return value === "normal" || value === "warning" || value === "critical"
    ? value
    : fallback;
}

function normalizeTransactionStatus(
  value: string | undefined,
  fallback: VisibleTransactionResult["status"] = "pending",
): VisibleTransactionResult["status"] {
  if (value === "success" || value === "completed" || value === "sold") {
    return "success";
  }
  if (value === "failed" || value === "rejected") {
    return "failed";
  }
  return fallback;
}

function normalizeArchiveStatus(
  value: string | undefined,
): VisibleArchiveEntry["status"] | undefined {
  if (
    value === "normal" ||
    value === "warning" ||
    value === "critical" ||
    value === "success" ||
    value === "failed" ||
    value === "pending"
  ) {
    return value;
  }
  if (value === "completed" || value === "sold") {
    return "success";
  }
  if (value === "rejected") {
    return "failed";
  }
  return undefined;
}

function mapRiskStatus(
  risk: ProgramBRisk | ProgramBTransaction["riskContribution"] | undefined,
  fallback: VisibleRiskStatus,
): VisibleRiskStatus {
  if (typeof risk === "string") {
    return normalizeRiskStatus(risk, fallback);
  }

  const explicit =
    risk && ("status" in risk || "level" in risk)
      ? ("status" in risk ? risk.status : undefined) ??
        ("level" in risk ? risk.level : undefined)
      : undefined;

  if (explicit) {
    return normalizeRiskStatus(explicit, fallback);
  }

  const maximum = getMaximumNumericRisk(risk);

  if (maximum === null) {
    return fallback;
  }

  if (maximum > 75) {
    return "critical";
  }

  return maximum > 40 ? "warning" : "normal";
}

function summarizeNumericRisk(risk: ProgramBRisk | undefined): string | null {
  if (!risk || typeof risk === "string") {
    return null;
  }

  const values = [
    ["监管", risk.regulatory],
    ["舆情", risk.publicOpinion],
    ["内部怀疑", risk.internalSuspicion],
  ] as const;

  if (values.every(([, value]) => typeof value !== "number")) {
    return null;
  }

  return values
    .map(([label, value]) => `${label} ${formatRiskValue(value)}`)
    .join(" / ");
}

function mapRiskMetrics(
  risk: ProgramBRisk | undefined,
  fallback: VisibleGameState["riskMetrics"],
): VisibleGameState["riskMetrics"] {
  if (!risk || typeof risk === "string") {
    return fallback;
  }

  return {
    regulatory:
      typeof risk.regulatory === "number" ? risk.regulatory : fallback.regulatory,
    publicOpinion:
      typeof risk.publicOpinion === "number"
        ? risk.publicOpinion
        : fallback.publicOpinion,
    internalSuspicion:
      typeof risk.internalSuspicion === "number"
        ? risk.internalSuspicion
        : fallback.internalSuspicion,
  };
}

function getMaximumNumericRisk(
  risk:
    | Exclude<ProgramBRisk, string>
    | ProgramBTransaction["riskContribution"]
    | undefined,
): number | null {
  if (!risk) {
    return null;
  }

  const values = [
    risk.regulatory,
    risk.publicOpinion,
    risk.internalSuspicion,
  ].filter((value): value is number => typeof value === "number");

  return values.length > 0 ? Math.max(...values) : null;
}

function formatRiskValue(value: number | undefined): string {
  return typeof value === "number" ? value.toFixed(1) : "-";
}

function getOperationOutcome<TState extends ProgramBStateContract>(
  result: ProgramBOperationResult<TState>,
): ProgramBOperationOutcome | null {
  if (!result || typeof result !== "object" || !("ok" in result)) {
    return null;
  }

  return result as ProgramBOperationOutcome;
}

function didOperationSucceed<TState extends ProgramBStateContract>(
  result: ProgramBOperationResult<TState>,
): boolean {
  return getOperationOutcome(result)?.ok !== false;
}

function getPackageId(dataPackage: ProgramBPackage | undefined): string | null {
  return dataPackage?.id ?? dataPackage?.packageId ?? null;
}

function isProgramAWorkbenchSlot(slotIndex: number): boolean {
  return (
    Number.isInteger(slotIndex) &&
    slotIndex >= 0 &&
    slotIndex < PROGRAM_A_WORKBENCH_SLOT_COUNT
  );
}
