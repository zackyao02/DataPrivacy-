import type {
  Buyer,
  CardTemplate,
  NewsTemplate,
  PackagePreview,
  RiskLevel,
} from "../../program-c/src/content";
import type {
  DailyChallengeResponse,
  GameCommandPort,
  GameEventListener,
  GameEventPort,
  GameStatePort,
} from "./GamePorts";
import { ProgramBBridge } from "./ProgramBBridge";
import {
  type EmotionChoice,
  WeekOneSliceController,
  type WeekOneEndingReport,
  type WeekOneSliceSnapshot,
  type WeekOneSoldLogEntry,
} from "./WeekOneSliceController";
import {
  freezeVisibleGameState,
  type VisibleArchiveEntry,
  type VisibleBadge,
  type VisibleBuyer,
  type VisibleDailyChallenge,
  type VisibleDailyChallengeKind,
  type VisibleDailyChallengeTask,
  type VisibleDailyFlow,
  type VisibleDataCard,
  type VisibleEndingReport,
  type VisibleGameState,
  type VisibleMonologue,
  type VisiblePackageCandidate,
  type VisibleProcessedPackage,
  type VisibleRiskLog,
  type VisibleRiskStatus,
  type VisibleTransactionResult,
  type VisibleYesterdayNews,
} from "./VisibleGameState";

const PROGRAM_A_WORKBENCH_SLOT_COUNT = 3;

export interface WeekOneProgramBRawCard {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly sensitivity: VisibleDataCard["sensitivity"];
  readonly disabled?: boolean;
}

export interface WeekOneProgramBPackage {
  readonly id: string;
  readonly label: string;
  readonly packageId?: string;
  readonly name?: string;
  readonly isWaste?: boolean;
}

export interface WeekOneProgramBBuyer {
  readonly id: string;
  readonly displayName: string;
  readonly buyerId?: string;
  readonly name?: string;
}

export interface WeekOneProgramBNews {
  readonly title: string;
  readonly summary: string;
  readonly dateLabel: string;
}

export interface WeekOneProgramBActiveChallenge {
  readonly status: "ready" | "active" | "success" | "failed";
  readonly passed: boolean;
  readonly completed: boolean;
  readonly lastResult: {
    readonly message: string;
    readonly feedback: string;
  } | null;
}

export interface WeekOneProgramBDailyEmotion {
  readonly required: boolean;
  readonly resolved: boolean;
  readonly feedback: string | null;
}

export interface WeekOneProgramBRiskState {
  readonly status: VisibleRiskStatus;
  readonly logs: readonly VisibleRiskLog[];
  readonly consequenceSummary: string | null;
  readonly regulatory: number | null;
  readonly publicOpinion: number | null;
  readonly internalSuspicion: number | null;
}

export interface WeekOneProgramBStateContract {
  readonly day: number;
  readonly conscience: number;
  readonly clarity_score: number;
  readonly dailyFlow: VisibleDailyFlow;
  readonly dailyChallenge: VisibleDailyChallenge | null;
  readonly activeChallenge: WeekOneProgramBActiveChallenge | null;
  readonly dailyEmotion: WeekOneProgramBDailyEmotion;
  readonly dailyMonologue: VisibleMonologue | null;
  readonly blackboxDialogue: string | null;
  readonly rawCards: readonly WeekOneProgramBRawCard[];
  readonly workbench: readonly (string | null)[];
  readonly packageInventory: readonly WeekOneProgramBPackage[];
  readonly buyers: readonly WeekOneProgramBBuyer[];
  readonly dailyNews: WeekOneProgramBNews | null;
  readonly newsArchive: readonly WeekOneProgramBNews[];
  readonly risk: WeekOneProgramBRiskState;
  readonly transactions: readonly WeekOneProgramBTransaction[];
  readonly sold_log: readonly WeekOneProgramBTransaction[];
  readonly operationLogs: readonly VisibleArchiveEntry[];
  readonly blackBoxArchive: readonly VisibleArchiveEntry[];
  readonly monologueArchive: readonly VisibleArchiveEntry[];
  readonly badges: readonly VisibleBadge[];
  readonly selectedPackageId: string | null;
  readonly selectedBuyerId: string | null;
  readonly monitorAvailable: boolean;
  readonly endingAvailable: boolean;
  readonly endingTriggered: boolean;
  readonly ending_report: VisibleEndingReport | null;
  readonly operationPadCardId: string | null;
}

export interface WeekOneProgramBTransaction {
  readonly id: string;
  readonly packageId: string | null;
  readonly buyerId: string | null;
  readonly status: "success" | "failed" | "pending";
  readonly summary: string;
}

export interface WeekOneProgramBOperationOutcome {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly package?: WeekOneProgramBPackage;
  readonly transaction?: WeekOneProgramBTransaction;
  readonly candidates?: readonly VisiblePackageCandidate[];
}

export interface WeekOneProgramBRuntimeBinding {
  getState(): WeekOneProgramBStateContract;
  onStateChange(
    listener: (state: Readonly<WeekOneProgramBStateContract>) => void,
  ): () => void;
  onGameEvent(listener: GameEventListener): () => void;
  submitCardToOperationPad(
    gameState: WeekOneProgramBStateContract,
    cardId: string,
  ): WeekOneProgramBOperationOutcome;
  placeCardToSlot(
    gameState: WeekOneProgramBStateContract,
    cardId: string,
    slotIndex: number,
  ): WeekOneProgramBOperationOutcome;
  removeCardFromSlot(
    gameState: WeekOneProgramBStateContract,
    slotIndex: number,
  ): WeekOneProgramBOperationOutcome;
  createPackage(
    gameState: WeekOneProgramBStateContract,
    preferredRecipeId?: string,
  ): WeekOneProgramBOperationOutcome;
  sellPackage(
    gameState: WeekOneProgramBStateContract,
    packageId: string,
    buyerId: string,
  ): WeekOneProgramBOperationOutcome;
  submitDailyChallengeChoice(
    gameState: WeekOneProgramBStateContract,
    challengeId: string,
    choiceId: string,
  ): WeekOneProgramBOperationOutcome;
  submitDailyChallenge(
    gameState: WeekOneProgramBStateContract,
    challengeId: string,
    response: DailyChallengeResponse,
  ): WeekOneProgramBOperationOutcome;
  selectEmotion(
    gameState: WeekOneProgramBStateContract,
    emotion: EmotionChoice,
  ): WeekOneProgramBOperationOutcome;
  advanceDailyPhase(
    gameState: WeekOneProgramBStateContract,
  ): WeekOneProgramBOperationOutcome;
}

export class WeekOneProgramBAdapter
  implements GameStatePort, GameCommandPort, GameEventPort
{
  readonly runtimeBinding: WeekOneProgramBRuntimeBinding;

  private visibleState: Readonly<VisibleGameState>;
  private selectedPackageId: string | null = null;
  private selectedBuyerId: string | null = null;
  private readonly visibleStateListeners = new Set<
    (state: Readonly<VisibleGameState>) => void
  >();
  private readonly rawStateListeners = new Set<
    (state: Readonly<WeekOneProgramBStateContract>) => void
  >();
  private readonly detachProgramBState: () => void;

  constructor(
    private readonly controller: WeekOneSliceController,
    private readonly programB: ProgramBBridge,
  ) {
    this.visibleState = this.mapVisibleState();
    const runtimeBinding: WeekOneProgramBRuntimeBinding = {
      getState: () => this.getState(),
      onStateChange: (listener) => this.onRawStateChange(listener),
      onGameEvent: (listener) => this.onGameEvent(listener),
      submitCardToOperationPad: (_state, cardId) =>
        this.submitCardToOperationPadOutcome(cardId),
      placeCardToSlot: (_state, cardId, slotIndex) =>
        this.placeCardToSlotOutcome(cardId, slotIndex),
      removeCardFromSlot: (_state, slotIndex) =>
        this.removeCardFromSlotOutcome(slotIndex),
      createPackage: (_state, preferredRecipeId) =>
        this.createPackageOutcome(preferredRecipeId),
      sellPackage: (_state, packageId, buyerId) =>
        this.submitTransactionOutcome(packageId, buyerId),
      submitDailyChallengeChoice: (_state, challengeId, choiceId) =>
        this.submitDailyChallengeChoiceOutcome(challengeId, choiceId),
      submitDailyChallenge: (_state, challengeId, response) =>
        this.submitDailyChallengeOutcome(challengeId, response),
      selectEmotion: (_state, emotion) => this.selectEmotionOutcome(emotion),
      advanceDailyPhase: () => this.advanceDailyPhaseOutcome(),
    };
    this.runtimeBinding = Object.freeze(runtimeBinding);
    this.detachProgramBState = this.programB.onStateChange(() => {
      this.publishState();
    });
  }

  getVisibleState(): Readonly<VisibleGameState> {
    return this.visibleState;
  }

  getState(): WeekOneProgramBStateContract {
    const visibleState = this.getVisibleState();
    const snapshot = this.controller.getSnapshot();
    const transactions = this.mapTransactions(snapshot.saveState?.sold_log ?? []);

    return Object.freeze({
      day: visibleState.day,
      conscience: visibleState.conscience,
      clarity_score: visibleState.clarityScore,
      dailyFlow: visibleState.dailyFlow,
      dailyChallenge: visibleState.dailyFlow.challenge,
      activeChallenge: visibleState.dailyFlow.challenge
        ? this.mapActiveChallenge(visibleState.dailyFlow.challenge, snapshot)
        : null,
      dailyEmotion: {
        required: visibleState.dailyFlow.phase === "emotion",
        resolved: snapshot.selectedEmotion !== null,
        feedback: snapshot.emotionResponse,
      },
      dailyMonologue: visibleState.dailyFlow.monologue,
      blackboxDialogue: visibleState.dailyFlow.blackBoxLine,
      rawCards: visibleState.rawCards,
      workbench: visibleState.workbench.slotCardIds,
      packageInventory: visibleState.processedPackages.map((item) => ({
        id: item.id,
        label: item.label,
        packageId: item.id,
        name: item.label,
      })),
      buyers: visibleState.buyers.map((buyer) => ({
        id: buyer.id,
        displayName: buyer.displayName,
        buyerId: buyer.id,
        name: buyer.displayName,
      })),
      dailyNews: visibleState.yesterdayNews,
      newsArchive: visibleState.newsArchive,
      risk: {
        status: visibleState.riskStatus,
        logs: visibleState.riskLogs,
        consequenceSummary: visibleState.consequenceSummary,
        regulatory: visibleState.riskMetrics.regulatory,
        publicOpinion: visibleState.riskMetrics.publicOpinion,
        internalSuspicion: visibleState.riskMetrics.internalSuspicion,
      },
      transactions,
      sold_log: transactions,
      operationLogs: visibleState.operationLogs,
      blackBoxArchive: visibleState.blackBoxArchive,
      monologueArchive: visibleState.monologueArchive,
      badges: visibleState.badges,
      selectedPackageId: visibleState.selectedPackageId,
      selectedBuyerId: visibleState.selectedBuyerId,
      monitorAvailable: visibleState.monitor.desktopAvailable,
      endingAvailable: visibleState.ending.available,
      endingTriggered: visibleState.ending.available,
      ending_report: visibleState.ending.report,
      operationPadCardId: visibleState.operationPadCardId,
    });
  }

  onVisibleStateChange(
    listener: (state: Readonly<VisibleGameState>) => void,
  ): () => void {
    this.visibleStateListeners.add(listener);
    return () => this.visibleStateListeners.delete(listener);
  }

  onRawStateChange(
    listener: (state: Readonly<WeekOneProgramBStateContract>) => void,
  ): () => void {
    this.rawStateListeners.add(listener);
    return () => this.rawStateListeners.delete(listener);
  }

  onGameEvent(listener: GameEventListener): () => void {
    return this.programB.onEvent(listener);
  }

  submitCardToOperationPad(cardId: string): void {
    this.submitCardToOperationPadOutcome(cardId);
  }

  placeCardToSlot(cardId: string, slotIndex: number): void {
    this.placeCardToSlotOutcome(cardId, slotIndex);
  }

  removeCardFromSlot(slotIndex: number): void {
    this.removeCardFromSlotOutcome(slotIndex);
  }

  createPackage(preferredRecipeId?: string): void {
    this.createPackageOutcome(preferredRecipeId);
  }

  selectPackage(packageId: string): void {
    this.selectedPackageId = packageId;
    this.publishState();
  }

  selectBuyer(buyerId: string): void {
    this.selectedBuyerId = buyerId;
    this.publishState();
  }

  submitTransaction(packageId: string, buyerId: string): void {
    this.submitTransactionOutcome(packageId, buyerId);
  }

  submitDailyChallengeChoice(challengeId: string, choiceId: string): void {
    this.submitDailyChallengeChoiceOutcome(challengeId, choiceId);
  }

  submitDailyChallenge(
    challengeId: string,
    response: DailyChallengeResponse,
  ): void {
    this.submitDailyChallengeOutcome(challengeId, response);
  }

  selectEmotion(emotion: EmotionChoice): void {
    this.selectEmotionOutcome(emotion);
  }

  advanceDailyPhase(): void {
    this.advanceDailyPhaseOutcome();
  }

  refresh(): Readonly<VisibleGameState> {
    this.publishState();
    return this.visibleState;
  }

  destroy(): void {
    this.detachProgramBState();
    this.visibleStateListeners.clear();
    this.rawStateListeners.clear();
  }

  private submitCardToOperationPadOutcome(
    cardId: string,
  ): WeekOneProgramBOperationOutcome {
    const slotIndex = this.findFirstAvailableSlotIndex();

    if (slotIndex === -1) {
      return this.outcome(false, "slot-limit", "工作台没有可用槽位。");
    }

    return this.placeCardToSlotOutcome(cardId, slotIndex);
  }

  private placeCardToSlotOutcome(
    cardId: string,
    slotIndex: number,
  ): WeekOneProgramBOperationOutcome {
    const ok = this.controller.placeCardInSlot(cardId, slotIndex);
    return this.outcome(
      ok,
      ok ? "card-placed" : "card-place-failed",
      this.controller.getSnapshot().message,
    );
  }

  private removeCardFromSlotOutcome(
    slotIndex: number,
  ): WeekOneProgramBOperationOutcome {
    const ok = this.controller.removeCardFromSlot(slotIndex);
    return this.outcome(
      ok,
      ok ? "card-removed" : "card-remove-failed",
      this.controller.getSnapshot().message,
    );
  }

  private createPackageOutcome(
    preferredRecipeId?: string,
  ): WeekOneProgramBOperationOutcome {
    void preferredRecipeId;
    const ok = this.controller.sealPackage();
    const snapshot = this.controller.getSnapshot();
    const dataPackage = snapshot.activePackage
      ? this.mapPackage(snapshot.activePackage)
      : undefined;

    if (dataPackage) {
      this.selectedPackageId = dataPackage.id;
      this.selectedBuyerId = snapshot.activePackage?.buyers[0]?.id ?? null;
    }

    return {
      ...this.outcome(
        ok,
        ok ? "package-created" : "package-create-failed",
        snapshot.message,
      ),
      ...(dataPackage ? { package: dataPackage } : {}),
      candidates: snapshot.packagePreviews.map((preview) =>
        this.mapPackageCandidate(preview),
      ),
    };
  }

  private submitTransactionOutcome(
    packageId: string,
    buyerId: string,
  ): WeekOneProgramBOperationOutcome {
    this.selectedPackageId = packageId;
    this.selectedBuyerId = buyerId;
    const snapshot = this.controller.getSnapshot();
    const transaction: WeekOneProgramBTransaction = {
      id: `transaction-${snapshot.day}-${packageId}-${buyerId}`,
      packageId,
      buyerId,
      status: snapshot.activePackage ? "success" : "pending",
      summary: snapshot.activePackage
        ? `已确认交易：${packageId} -> ${buyerId}`
        : "当前没有可确认的数据包交易。",
    };

    if (snapshot.activePackage) {
      this.programB.emit("transactionSuccess", { packageId, buyerId });
      this.programB.emit("transactionSealed", { packageId, buyerId });
    }

    this.publishState();
    return {
      ...this.outcome(
        Boolean(snapshot.activePackage),
        snapshot.activePackage ? "transaction-success" : "transaction-pending",
        transaction.summary,
      ),
      transaction,
    };
  }

  private submitDailyChallengeOutcome(
    challengeId: string,
    response: DailyChallengeResponse,
  ): WeekOneProgramBOperationOutcome {
    const challenge = this.controller.getSnapshot().activeChallenge;

    if (!challenge || challenge.id !== challengeId) {
      return this.outcome(false, "challenge-mismatch", "当前没有匹配的小关卡。");
    }

    let lastOutcome = this.outcome(false, "empty-response", "没有提交答案。");

    for (const answer of response.answers) {
      for (const optionId of answer.optionIds) {
        lastOutcome = this.submitDailyChallengeChoiceOutcome(challengeId, optionId);
      }
    }

    return lastOutcome;
  }

  private submitDailyChallengeChoiceOutcome(
    challengeId: string,
    choiceId: string,
  ): WeekOneProgramBOperationOutcome {
    const snapshot = this.controller.getSnapshot();
    const challenge = snapshot.activeChallenge;

    if (!challenge || challenge.id !== challengeId) {
      return this.outcome(false, "challenge-mismatch", "当前没有匹配的小关卡。");
    }

    let ok = false;

    switch (challenge.type) {
      case "protocol_match":
        ok = this.controller.acceptProtocolTerm(stripPrefix(choiceId, "term:"));
        break;
      case "data_cleaning":
        ok = this.controller.cleanDataItem(stripPrefix(choiceId, "clean:"));
        break;
      case "public_opinion":
        ok = this.controller.choosePublicOpinionTactic(stripPrefix(choiceId, "tactic:"));
        break;
      case "profile_puzzle":
        ok = this.controller.selectPuzzleFragment(stripPrefix(choiceId, "fragment:"));
        break;
      case "buyer_negotiation":
        ok = this.controller.chooseNegotiationOption(stripPrefix(choiceId, "option:"));
        break;
      case "protocol_scan":
        ok = this.submitProtocolScanChoice(choiceId);
        break;
      case "evidence_chain":
        ok = this.submitEvidenceChoice(choiceId);
        break;
    }

    const nextSnapshot = this.controller.getSnapshot();
    return this.outcome(
      ok || nextSnapshot.miniGame.status !== "playing",
      nextSnapshot.miniGame.status,
      nextSnapshot.message,
    );
  }

  private selectEmotionOutcome(emotion: EmotionChoice): WeekOneProgramBOperationOutcome {
    this.controller.chooseEmotion(emotion);
    this.programB.emit("emotionSelected", { emotion });
    return this.outcome(true, "emotion-selected", this.controller.getSnapshot().message);
  }

  private advanceDailyPhaseOutcome(): WeekOneProgramBOperationOutcome {
    const snapshot = this.controller.getSnapshot();

    if (snapshot.phase === "workbench") {
      return this.createPackageOutcome();
    }

    if (snapshot.phase === "news") {
      if (!snapshot.selectedEmotion) {
        return this.outcome(false, "emotion-required", "需要先选择情绪反馈。");
      }

      const ok = this.controller.beginChallenge();
      return this.outcome(
        ok,
        ok ? "challenge-started" : "challenge-start-failed",
        this.controller.getSnapshot().message,
      );
    }

    return this.outcome(false, "phase-locked", "当前阶段由小关卡判定推进。");
  }

  private submitProtocolScanChoice(choiceId: string): boolean {
    if (choiceId.startsWith("clause:")) {
      return this.controller.markProtocolScanClause(stripPrefix(choiceId, "clause:"));
    }

    if (choiceId.startsWith("flow:")) {
      return this.controller.matchProtocolScanFlow(stripPrefix(choiceId, "flow:"));
    }

    if (choiceId.startsWith("hidden:")) {
      return this.controller.findProtocolScanHiddenClause();
    }

    if (choiceId.startsWith("risk:")) {
      const level = stripPrefix(choiceId, "risk:") as RiskLevel;
      return this.controller.answerProtocolScanRisk(level);
    }

    return false;
  }

  private submitEvidenceChoice(choiceId: string): boolean {
    if (choiceId.startsWith("day:")) {
      return this.controller.collectEvidenceDay(Number(stripPrefix(choiceId, "day:")));
    }

    if (choiceId.startsWith("fragment:")) {
      return this.controller.collectEvidenceFragment(stripPrefix(choiceId, "fragment:"));
    }

    if (choiceId.startsWith("connection:")) {
      return this.controller.connectEvidenceChain(stripPrefix(choiceId, "connection:"));
    }

    if (choiceId === "upload") {
      return this.controller.submitEvidenceChain();
    }

    return false;
  }

  private publishState(): void {
    this.visibleState = this.mapVisibleState();
    this.visibleStateListeners.forEach((listener) => listener(this.visibleState));
    const rawState = this.getState();
    this.rawStateListeners.forEach((listener) => listener(rawState));
  }

  private mapVisibleState(): Readonly<VisibleGameState> {
    const snapshot = this.controller.getSnapshot();
    const endingAvailable = this.isEndingAvailable(snapshot);
    const dailyFlow = this.mapDailyFlow(snapshot, endingAvailable);
    const processedPackages = this.mapProcessedPackages(snapshot);
    const buyers = this.mapBuyers(snapshot);
    const selectedPackageId =
      this.selectedPackageId ?? snapshot.activePackage?.packageType ?? null;
    const selectedBuyerId = this.selectedBuyerId ?? buyers[0]?.id ?? null;
    const transactions = this.mapTransactions(snapshot.saveState?.sold_log ?? []);

    return freezeVisibleGameState({
      day: snapshot.day,
      clarityScore: snapshot.endingPrototype.awarenessValue,
      conscience: mapConscience(snapshot.endingPrototype.awarenessValue),
      dailyFlow,
      rawCards: snapshot.availableCards.slice(0, 8).map(mapCard),
      operationPadCardId: snapshot.selectedCardIds.at(-1) ?? null,
      processedPackages,
      packageCandidates: snapshot.packagePreviews.map((preview) =>
        this.mapPackageCandidate(preview),
      ),
      workbench: {
        slotCardIds: Array.from(
          { length: PROGRAM_A_WORKBENCH_SLOT_COUNT },
          (_, index) => snapshot.selectedCardIds[index] ?? null,
        ),
      },
      buyers,
      selectedPackageId,
      selectedBuyerId,
      lastTransactionResult: this.mapLastTransaction(transactions, snapshot),
      riskLogs: this.mapRiskLogs(snapshot),
      consequenceSummary: snapshot.activeNews
        ? this.controller.fillText(snapshot.activeNews.body)
        : snapshot.message,
      yesterdayNews: snapshot.activeNews ? this.mapNews(snapshot.activeNews) : null,
      operationLogs: this.mapOperationLogs(snapshot, transactions),
      newsArchive: snapshot.activeNews ? [this.mapNews(snapshot.activeNews)] : [],
      blackBoxArchive: snapshot.activeBlackBoxLine
        ? [
            {
              id: snapshot.activeBlackBoxLine.id,
              title: "Black Box",
              summary: this.controller.fillText(snapshot.activeBlackBoxLine.text),
              day: snapshot.day,
            },
          ]
        : [],
      monologueArchive: snapshot.activeMonologue
        ? [
            {
              id: snapshot.activeMonologue.id,
              title: snapshot.activeMonologue.title,
              summary: snapshot.activeMonologue.textSegments
                .map((text) => this.controller.fillText(text))
                .join(" "),
              day: snapshot.day,
            },
          ]
        : [],
      badges: this.mapBadges(snapshot),
      riskStatus: this.mapRiskStatus(snapshot),
      riskMetrics: this.mapRiskMetrics(snapshot),
      monitor: { desktopAvailable: true },
      ending: {
        available: endingAvailable,
        report: endingAvailable ? mapEndingReport(snapshot.endingReport) : null,
      },
    });
  }

  private mapDailyFlow(
    snapshot: WeekOneSliceSnapshot,
    endingAvailable: boolean,
  ): VisibleDailyFlow {
    return {
      phase: this.mapDailyPhase(snapshot, endingAvailable),
      challenge: this.mapDailyChallenge(snapshot),
      blackBoxLine: snapshot.activeBlackBoxLine
        ? this.controller.fillText(snapshot.activeBlackBoxLine.text)
        : null,
      emotionPrompt:
        snapshot.phase === "news"
          ? snapshot.selectedEmotion
            ? snapshot.emotionResponse
            : "选择你对这条新闻的第一反应。"
          : null,
      monologue: snapshot.activeMonologue
        ? {
            title: snapshot.activeMonologue.title,
            speaker: snapshot.activeMonologue.speaker,
            textSegments: snapshot.activeMonologue.textSegments.map((text) =>
              this.controller.fillText(text),
            ),
            closingCue: snapshot.activeMonologue.closingCue,
          }
        : null,
    };
  }

  private mapDailyPhase(
    snapshot: WeekOneSliceSnapshot,
    endingAvailable: boolean,
  ): VisibleDailyFlow["phase"] {
    if (endingAvailable) {
      return "ending";
    }

    if (snapshot.phase === "challenge") {
      return "challenge";
    }

    if (snapshot.phase === "news") {
      return snapshot.selectedEmotion ? "monologue" : "emotion";
    }

    return "processing";
  }

  private mapDailyChallenge(
    snapshot: WeekOneSliceSnapshot,
  ): VisibleDailyChallenge | null {
    const challenge = snapshot.activeChallenge;

    if (!challenge) {
      return null;
    }

    const tasks = this.mapChallengeTasks(snapshot);
    const choices = tasks.flatMap((task) => task.options);
    const kind = mapChallengeKind(challenge.type);

    return {
      id: challenge.id,
      day: challenge.day,
      kind,
      title: challenge.title,
      briefing: this.controller.fillText(challenge.briefing),
      objective: this.controller.fillText(challenge.objective),
      requiredApp: kind === "buyer-negotiation" ? "buyer-trade" : "data-processing",
      choices,
      tasks,
      status: this.mapChallengeStatus(snapshot),
      feedback: snapshot.message,
    };
  }

  private mapChallengeTasks(
    snapshot: WeekOneSliceSnapshot,
  ): readonly VisibleDailyChallengeTask[] {
    const challenge = snapshot.activeChallenge;

    if (!challenge) {
      return [];
    }

    switch (challenge.type) {
      case "protocol_match":
        return [
          makeTask({
            id: "protocol-terms",
            prompt: "选择需要伪装的协议词条。",
            selectionMode: "multiple",
            minSelections: snapshot.miniGame.protocolTerms.length,
            maxSelections: snapshot.miniGame.protocolTerms.length,
            options: snapshot.miniGame.protocolTerms.map((term) => ({
              id: `term:${term.id}`,
              label: `${term.riskyTerm} -> ${term.disguisedTerm}`,
              description: this.controller.fillText(term.explanation),
            })),
          }),
        ];
      case "data_cleaning":
        return [
          makeTask({
            id: "cleaning-items",
            prompt: "点选需要清理的敏感数据项。",
            selectionMode: "multiple",
            minSelections: challenge.successCondition.requiredSensitiveClicks,
            maxSelections: null,
            options: snapshot.miniGame.cleaningItems.map((item) => ({
              id: `clean:${item.id}`,
              label: item.label,
              description: `${item.kind} / ${item.meta} / ${item.description}`,
            })),
          }),
        ];
      case "public_opinion":
        return [
          makeTask({
            id: "public-opinion-tactic",
            prompt: snapshot.activePublicOpinion?.manipulationGoal ?? challenge.objective,
            selectionMode: "single",
            minSelections: 1,
            maxSelections: 1,
            options: snapshot.miniGame.publicOpinionTactics.map((tactic) => ({
              id: `tactic:${tactic.id}`,
              label: tactic.label,
              description: tactic.playerPrompt,
            })),
          }),
        ];
      case "profile_puzzle":
        return [
          makeTask({
            id: "profile-fragments",
            prompt: snapshot.activeProfilePuzzle?.targetProfile ?? challenge.objective,
            selectionMode: "multiple",
            minSelections: snapshot.miniGame.puzzleFragments.filter((item) => !item.decoy)
              .length,
            maxSelections: snapshot.miniGame.puzzleFragments.length,
            options: snapshot.miniGame.puzzleFragments.map((fragment) => ({
              id: `fragment:${fragment.id}`,
              label: fragment.label,
              description: fragment.text,
            })),
          }),
        ];
      case "buyer_negotiation":
        return [
          makeTask({
            id: "buyer-negotiation-option",
            prompt: snapshot.activeNegotiation?.briefing ?? challenge.objective,
            selectionMode: "single",
            minSelections: 1,
            maxSelections: 1,
            options: snapshot.miniGame.negotiationOptions.map((option) => ({
              id: `option:${option.id}`,
              label: option.label,
              description: option.playerLine,
            })),
          }),
        ];
      case "protocol_scan":
        return this.mapProtocolScanTasks(snapshot);
      case "evidence_chain":
        return this.mapEvidenceChainTasks(snapshot);
    }
  }

  private mapProtocolScanTasks(
    snapshot: WeekOneSliceSnapshot,
  ): readonly VisibleDailyChallengeTask[] {
    const template = snapshot.miniGame.protocolScanTemplate;

    if (!template) {
      return [];
    }

    return [
      makeTask({
        id: "risk-clauses",
        prompt: "标记高风险条款。",
        selectionMode: "multiple",
        minSelections: template.riskClauses.length,
        maxSelections: template.riskClauses.length,
        options: template.riskClauses.map((clause) => ({
          id: `clause:${clause.id}`,
          label: clause.text,
        })),
      }),
      makeTask({
        id: "data-flow",
        prompt: "确认数据流向。",
        selectionMode: "multiple",
        minSelections: template.dataFlowMatches.length,
        maxSelections: template.dataFlowMatches.length,
        options: template.dataFlowMatches.map((flow) => ({
          id: `flow:${flow.id}`,
          label: `${flow.source} -> ${flow.destination}`,
        })),
      }),
      makeTask({
        id: "hidden-clause",
        prompt: "发现隐藏条款。",
        selectionMode: "single",
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: `hidden:${template.hiddenClause.id}`,
            label: template.hiddenClause.disguise,
            description: template.hiddenClause.text,
          },
        ],
      }),
      makeTask({
        id: "risk-answer",
        prompt: template.riskQuestion.prompt,
        selectionMode: "single",
        minSelections: 1,
        maxSelections: 1,
        options: (["low", "medium", "high"] as const).map((level) => ({
          id: `risk:${level}`,
          label: level,
        })),
      }),
    ];
  }

  private mapEvidenceChainTasks(
    snapshot: WeekOneSliceSnapshot,
  ): readonly VisibleDailyChallengeTask[] {
    const template = snapshot.miniGame.evidenceChainTemplate;

    if (!template) {
      return [];
    }

    if (snapshot.endingPrototype.unlockedPath === "final_package") {
      return [
        makeTask({
          id: "final-package",
          prompt: template.finalPackage.outcomeText,
          selectionMode: "single",
          minSelections: 1,
          maxSelections: 1,
          options: [{ id: "upload", label: template.finalPackage.title }],
        }),
      ];
    }

    const evidenceDays = [
      ...new Set(template.fragments.map((fragment) => fragment.day)),
    ].sort((left, right) => left - right);

    return [
      makeTask({
        id: "evidence-days",
        prompt: "收集每天的证据文件夹。",
        selectionMode: "multiple",
        minSelections: evidenceDays.length,
        maxSelections: evidenceDays.length,
        options: evidenceDays.map((day) => ({
          id: `day:${day}`,
          label: `Day ${day}`,
          description: `${template.fragments.filter((fragment) => fragment.day === day).length} 件证据`,
        })),
      }),
      makeTask({
        id: "evidence-connections",
        prompt: "连接关键证据链。",
        selectionMode: "multiple",
        minSelections: template.connections.length,
        maxSelections: template.connections.length,
        options: template.connections.map((connection) => ({
          id: `connection:${connection.id}`,
          label: connection.label,
          description: connection.rationale,
        })),
      }),
      makeTask({
        id: "upload",
        prompt: "提交举报材料。",
        selectionMode: "single",
        minSelections: 1,
        maxSelections: 1,
        options: [{ id: "upload", label: "上传证据链" }],
      }),
    ];
  }

  private mapChallengeStatus(
    snapshot: WeekOneSliceSnapshot,
  ): VisibleDailyChallenge["status"] {
    if (snapshot.miniGame.status === "success") {
      return "success";
    }

    if (snapshot.miniGame.status === "failed") {
      return "failed";
    }

    return snapshot.phase === "challenge" ? "active" : "ready";
  }

  private mapActiveChallenge(
    challenge: VisibleDailyChallenge,
    snapshot: WeekOneSliceSnapshot,
  ): WeekOneProgramBActiveChallenge {
    const completed = challenge.status === "success" || challenge.status === "failed";

    return {
      status: challenge.status,
      passed: challenge.status === "success",
      completed,
      lastResult: completed
        ? {
            message: snapshot.message,
            feedback: challenge.feedback ?? snapshot.message,
          }
        : null,
    };
  }

  private mapProcessedPackages(
    snapshot: WeekOneSliceSnapshot,
  ): readonly VisibleProcessedPackage[] {
    const packages = [
      ...(snapshot.activePackage ? [this.mapPackage(snapshot.activePackage)] : []),
      ...(snapshot.saveState?.sold_log ?? []).map((entry) => ({
        id: entry.packType,
        label: entry.packType,
      })),
    ];
    const seen = new Set<string>();

    return packages.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
  }

  private mapPackage(preview: PackagePreview): VisibleProcessedPackage {
    return {
      id: preview.packageType,
      label: preview.recipe.displayName ?? preview.packageType,
    };
  }

  private mapPackageCandidate(preview: PackagePreview): VisiblePackageCandidate {
    return {
      id: preview.packageType,
      label: preview.recipe.displayName ?? preview.packageType,
      summary: preview.ready
        ? "当前卡槽可封装。"
        : `缺少 ${preview.missingDataTypes.join(", ") || "无"}；额外 ${preview.extraCardIds.join(", ") || "无"}`,
    };
  }

  private mapBuyers(snapshot: WeekOneSliceSnapshot): readonly VisibleBuyer[] {
    const buyers = snapshot.activePackage?.buyers ?? snapshot.readyPackages[0]?.buyers ?? [];
    return buyers.slice(0, 5).map(mapBuyer);
  }

  private mapNews(news: NewsTemplate): VisibleYesterdayNews {
    return {
      title: this.controller.fillText(news.headline),
      summary: this.controller.fillText(news.body),
      dateLabel: `Day ${this.controller.getSnapshot().day} 新闻`,
    };
  }

  private mapLastTransaction(
    transactions: readonly WeekOneProgramBTransaction[],
    snapshot: WeekOneSliceSnapshot,
  ): VisibleTransactionResult | null {
    const latest = transactions.at(-1);

    if (latest) {
      return latest;
    }

    if (!snapshot.activePackage) {
      return null;
    }

    return {
      packageId: snapshot.activePackage.packageType,
      buyerId: snapshot.activePackage.buyers[0]?.id ?? null,
      status: "success",
      summary: `已封装 ${snapshot.activePackage.recipe.displayName ?? snapshot.activePackage.packageType}`,
    };
  }

  private mapTransactions(
    soldLog: readonly WeekOneSoldLogEntry[],
  ): readonly WeekOneProgramBTransaction[] {
    return soldLog.map((entry) => ({
      id: `sold-${entry.day}-${entry.packType}`,
      packageId: entry.packType,
      buyerId: entry.buyer,
      status: "success",
      summary: `Day ${entry.day}: ${entry.packType} -> ${entry.buyer}`,
    }));
  }

  private mapRiskLogs(snapshot: WeekOneSliceSnapshot): readonly VisibleRiskLog[] {
    const logs: VisibleRiskLog[] = [
      {
        id: `day-${snapshot.day}-message`,
        status: this.mapRiskStatus(snapshot),
        message: snapshot.message,
      },
    ];

    if (snapshot.activeBlackBoxLine) {
      logs.push({
        id: snapshot.activeBlackBoxLine.id,
        status: "warning",
        message: this.controller.fillText(snapshot.activeBlackBoxLine.text),
      });
    }

    return logs.slice(-4).reverse();
  }

  private mapOperationLogs(
    snapshot: WeekOneSliceSnapshot,
    transactions: readonly WeekOneProgramBTransaction[],
  ): readonly VisibleArchiveEntry[] {
    const currentStatus: VisibleArchiveEntry["status"] =
      snapshot.miniGame.status === "success"
        ? "success"
        : snapshot.miniGame.status === "failed"
          ? "failed"
          : "pending";

    return [
      {
        id: `state-${snapshot.day}-${snapshot.phase}`,
        title: `Day ${snapshot.day} ${snapshot.phase}`,
        summary: snapshot.message,
        day: snapshot.day,
        status: currentStatus,
      },
      ...transactions.map((transaction) => ({
        id: transaction.id,
        title: "Sold package",
        summary: transaction.summary,
        status: transaction.status,
      })),
    ].slice(-12).reverse();
  }

  private mapBadges(snapshot: WeekOneSliceSnapshot): readonly VisibleBadge[] {
    return snapshot.endingReport.badges.map((badge, index) => ({
      id: `badge-${index + 1}`,
      label: badge,
      unlocked: true,
    }));
  }

  private mapRiskStatus(snapshot: WeekOneSliceSnapshot): VisibleRiskStatus {
    if (
      snapshot.miniGame.status === "failed" ||
      snapshot.endingPrototype.unlockedPath === "final_package"
    ) {
      return "critical";
    }

    return snapshot.endingPrototype.awarenessValue < 3 ? "warning" : "normal";
  }

  private mapRiskMetrics(snapshot: WeekOneSliceSnapshot) {
    const awareness = snapshot.endingPrototype.awarenessValue;
    return {
      regulatory: clamp(45 + snapshot.day * 5, 0, 100),
      publicOpinion: clamp(50 - awareness * 4, 0, 100),
      internalSuspicion: clamp(35 + snapshot.selectedCardIds.length * 10, 0, 100),
    };
  }

  private isEndingAvailable(snapshot: WeekOneSliceSnapshot): boolean {
    return Boolean(
      snapshot.saveState?.ending_report ||
        snapshot.message.includes("个人数据泄露报告"),
    );
  }

  private findFirstAvailableSlotIndex(): number {
    const selectedCardIds = this.controller.getSnapshot().selectedCardIds;

    for (let index = 0; index < PROGRAM_A_WORKBENCH_SLOT_COUNT; index += 1) {
      if (!selectedCardIds[index]) {
        return index;
      }
    }

    return -1;
  }

  private outcome(
    ok: boolean,
    code: string,
    message: string,
  ): WeekOneProgramBOperationOutcome {
    return Object.freeze({ ok, code, message });
  }
}

export function createWeekOneProgramBAdapter(
  controller: WeekOneSliceController,
  programB: ProgramBBridge,
): WeekOneProgramBAdapter {
  return new WeekOneProgramBAdapter(controller, programB);
}

function mapCard(card: CardTemplate): VisibleDataCard {
  return {
    id: card.id,
    title: card.title,
    summary: card.summary,
    sensitivity: card.sensitivity,
  };
}

function mapBuyer(buyer: Buyer): VisibleBuyer {
  return {
    id: buyer.id,
    displayName: buyer.name,
  };
}

function mapChallengeKind(type: string): VisibleDailyChallengeKind {
  const map: Record<string, VisibleDailyChallengeKind> = {
    protocol_match: "protocol-match",
    data_cleaning: "data-cleaning",
    public_opinion: "public-opinion",
    profile_puzzle: "profile-puzzle",
    buyer_negotiation: "buyer-negotiation",
    protocol_scan: "protocol-scan",
    evidence_chain: "final-package",
  };

  return map[type] ?? "protocol-match";
}

function mapEndingReport(report: WeekOneEndingReport): VisibleEndingReport {
  return {
    title: report.title,
    endingTitle: report.endingTitle,
    endingBody: report.summary,
    rating: report.grade,
    literacyRating: report.ratingComment,
    playerNickname: report.nickname,
    days: 7,
    totalEarnings: null,
    totalConscienceLost: null,
    totalTransactions: report.packageCount,
    comment: report.ratingComment,
    advice: report.adviceText,
  };
}

function makeTask(task: VisibleDailyChallengeTask): VisibleDailyChallengeTask {
  return task;
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function mapConscience(awarenessValue: number): number {
  return clamp(Math.round(((awarenessValue + 6) / 18) * 100), 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
