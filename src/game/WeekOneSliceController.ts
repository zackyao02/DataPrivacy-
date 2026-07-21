import type {
  BlackBoxLine,
  BuyerNegotiationScript,
  BuyerNegotiationOption,
  CardTemplate,
  ContentRepository,
  DailyMonologue,
  DayChallenge,
  DataCleaningDecoyItem,
  DataCleaningSensitiveItem,
  DataType,
  EvidenceChainConnection,
  EvidenceChainFragment,
  EvidenceChainTemplate,
  NewsTemplate,
  PackagePreview,
  ProfilePuzzle,
  ProfilePuzzleFragment,
  ProtocolTerm,
  ProtocolScanTemplate,
  PublicOpinionScript,
  PublicOpinionTactic,
  RiskLevel,
  UserProfile,
} from "../../program-c/src/content";
import { ProgramBBridge } from "./ProgramBBridge";

export type EmotionChoice = "empathy" | "anger" | "numbness";
export type WeekOneSlicePhase = "workbench" | "news" | "challenge";
export type ChallengeStatus = "playing" | "success" | "failed";

export interface DataCleaningSliceItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly kind: "sensitive" | "decoy";
  readonly meta: string;
}

export interface WeekOneMiniGameState {
  readonly status: ChallengeStatus;
  readonly progressText: string;
  readonly protocolTerms: readonly ProtocolTerm[];
  readonly acceptedProtocolTermIds: readonly string[];
  readonly cleaningItems: readonly DataCleaningSliceItem[];
  readonly cleanedSensitiveItemIds: readonly string[];
  readonly cleaningMistakes: number;
  readonly maxCleaningMistakes: number;
  readonly puzzleFragments: readonly ProfilePuzzleFragment[];
  readonly acceptedPuzzleFragmentIds: readonly string[];
  readonly expectedPuzzleOrder: number;
  readonly negotiationOptions: readonly BuyerNegotiationOption[];
  readonly selectedNegotiationOptionId: string | null;
  readonly publicOpinionScript: PublicOpinionScript | null;
  readonly publicOpinionTactics: readonly PublicOpinionTactic[];
  readonly selectedPublicOpinionTacticId: string | null;
  readonly protocolScanTemplate: ProtocolScanTemplate | null;
  readonly markedProtocolScanClauseIds: readonly string[];
  readonly matchedProtocolScanFlowIds: readonly string[];
  readonly hiddenProtocolScanClauseFound: boolean;
  readonly selectedProtocolScanRiskLevel: RiskLevel | null;
  readonly protocolScanScore: number;
  readonly evidenceChainTemplate: EvidenceChainTemplate | null;
  readonly evidenceFragments: readonly EvidenceChainFragment[];
  readonly collectedEvidenceFragmentIds: readonly string[];
  readonly evidenceConnections: readonly EvidenceChainConnection[];
  readonly connectedEvidenceConnectionIds: readonly string[];
  readonly evidenceUploadComplete: boolean;
  readonly evidencePath: EndingPath;
}

export type EndingPath = "final_package" | "evidence_chain";

export interface EndingPrototypeState {
  readonly awarenessValue: number;
  readonly threshold: number;
  readonly unlockedPath: EndingPath;
  readonly unlockedPathLabel: string;
  readonly lockedPathLabel: string;
  readonly lockedReason: string | null;
  readonly reportGrade: "F" | "B+";
}

export interface WeekOneSliceSnapshot {
  readonly phase: WeekOneSlicePhase;
  readonly day: number;
  readonly user: UserProfile;
  readonly availableCards: readonly CardTemplate[];
  readonly selectedCardIds: readonly string[];
  readonly selectedCards: readonly CardTemplate[];
  readonly packagePreviews: readonly PackagePreview[];
  readonly readyPackages: readonly PackagePreview[];
  readonly activePackage: PackagePreview | null;
  readonly activeNews: NewsTemplate | null;
  readonly activeChallenge: DayChallenge | null;
  readonly activeProfilePuzzle: ProfilePuzzle | null;
  readonly activeNegotiation: BuyerNegotiationScript | null;
  readonly activePublicOpinion: PublicOpinionScript | null;
  readonly activeEvidenceChain: EvidenceChainTemplate | null;
  readonly activeMonologue: DailyMonologue | null;
  readonly activeBlackBoxLine: BlackBoxLine | null;
  readonly selectedEmotion: EmotionChoice | null;
  readonly emotionResponse: string | null;
  readonly miniGame: WeekOneMiniGameState;
  readonly endingPrototype: EndingPrototypeState;
  readonly message: string;
}

const PLAYABLE_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const MAX_SLOT_COUNT = 3;

const EMOTION_EVENTS: Record<EmotionChoice, string> = {
  empathy: "emotionEmpathySelected",
  anger: "emotionAngerSelected",
  numbness: "emotionNumbnessSelected",
};
const EMOTION_AWARENESS_DELTA: Record<EmotionChoice, number> = {
  empathy: 1,
  anger: 2,
  numbness: -1,
};

export class WeekOneSliceController {
  private readonly user: UserProfile;
  private selectedCardIds: string[];
  private dayIndex = 0;
  private phase: WeekOneSlicePhase = "workbench";
  private activePackage: PackagePreview | null = null;
  private activeNews: NewsTemplate | null = null;
  private activeChallenge: DayChallenge | null = null;
  private activeProfilePuzzle: ProfilePuzzle | null = null;
  private activeNegotiation: BuyerNegotiationScript | null = null;
  private activePublicOpinion: PublicOpinionScript | null = null;
  private activeProtocolScan: ProtocolScanTemplate | null = null;
  private activeEvidenceChain: EvidenceChainTemplate | null = null;
  private activeMonologue: DailyMonologue | null = null;
  private activeBlackBoxLine: BlackBoxLine | null = null;
  private selectedEmotion: EmotionChoice | null = null;
  private emotionResponse: string | null = null;
  private challengeStatus: ChallengeStatus = "playing";
  private acceptedProtocolTermIds: string[] = [];
  private cleanedSensitiveItemIds: string[] = [];
  private cleaningMistakes = 0;
  private acceptedPuzzleFragmentIds: string[] = [];
  private selectedNegotiationOptionId: string | null = null;
  private selectedPublicOpinionTacticId: string | null = null;
  private markedProtocolScanClauseIds: string[] = [];
  private matchedProtocolScanFlowIds: string[] = [];
  private hiddenProtocolScanClauseFound = false;
  private selectedProtocolScanRiskLevel: RiskLevel | null = null;
  private collectedEvidenceFragmentIds: string[] = [];
  private connectedEvidenceConnectionIds: string[] = [];
  private evidenceUploadComplete = false;
  private awarenessValue = 0;
  private completedChallengeDays: number[] = [];
  private message = "选择 3 张数据卡，封装第一个可用数据包。";

  constructor(
    private readonly content: ContentRepository,
    private readonly programB: ProgramBBridge,
  ) {
    this.user = content.getUsers()[0];
    this.selectedCardIds = this.pickInitialCardIds();
    this.patchProgramB();
  }

  getSnapshot(): WeekOneSliceSnapshot {
    const packagePreviews = this.content.findPackagePreviews(this.selectedCardIds);

    return {
      phase: this.phase,
      day: this.currentDay,
      user: this.user,
      availableCards: this.getWorkbenchCards(),
      selectedCardIds: [...this.selectedCardIds],
      selectedCards: this.content.findCardsByIds(this.selectedCardIds),
      packagePreviews,
      readyPackages: packagePreviews.filter((preview) => preview.ready),
      activePackage: this.activePackage,
      activeNews: this.activeNews,
      activeChallenge: this.activeChallenge,
      activeProfilePuzzle: this.activeProfilePuzzle,
      activeNegotiation: this.activeNegotiation,
      activePublicOpinion: this.activePublicOpinion,
      activeEvidenceChain: this.activeEvidenceChain,
      activeMonologue: this.activeMonologue,
      activeBlackBoxLine: this.activeBlackBoxLine,
      selectedEmotion: this.selectedEmotion,
      emotionResponse: this.emotionResponse,
      miniGame: this.getMiniGameState(),
      endingPrototype: this.getEndingPrototype(),
      message: this.message,
    };
  }

  fillText(template: string): string {
    return this.content.fillVariables(template, { user: this.user });
  }

  toggleCard(cardId: string): void {
    if (this.selectedCardIds.includes(cardId)) {
      this.selectedCardIds = this.selectedCardIds.filter((id) => id !== cardId);
      this.message = "已从槽位移除数据卡。";
      this.patchProgramB();
      return;
    }

    if (this.selectedCardIds.length >= MAX_SLOT_COUNT) {
      this.message = "工作台只有 3 个槽位，请先移除一张卡。";
      this.programB.emit("riskChanged", { reason: "slot-limit", cardId });
      return;
    }

    this.selectedCardIds = [...this.selectedCardIds, cardId];
    this.message = "数据卡已进入槽位。";
    this.programB.emit("cardMovedToSlot", { cardId, slotIndex: this.selectedCardIds.length - 1 });
    this.patchProgramB();
  }

  sealPackage(): boolean {
    const readyPackage = this.getSnapshot().readyPackages[0];

    if (!readyPackage) {
      this.message = "当前槽位不能生成有效数据包。";
      this.programB.emit("wasteCreated", {
        selectedCardIds: this.selectedCardIds,
      });
      this.patchProgramB();
      return false;
    }

    this.activePackage = readyPackage;
    this.activeNews = this.content.pickNewsForPackage(readyPackage.packageType) ?? null;
    this.activeChallenge = this.content.findChallengeByDay(this.currentDay) ?? null;
    this.activeProfilePuzzle =
      this.currentDay === 4 ? this.content.pickProfilePuzzleByDay(4) ?? null : null;
    this.activeNegotiation =
      this.currentDay === 5
        ? this.content.pickBuyerNegotiationScript(readyPackage.packageType) ?? null
        : null;
    this.activePublicOpinion =
      this.activeChallenge?.type === "public_opinion"
        ? this.pickPublicOpinionScript(readyPackage.packageType)
        : null;
    this.activeProtocolScan =
      this.activeChallenge?.type === "protocol_scan"
        ? this.content.pickProtocolScanTemplate(this.activeChallenge.protocolScanTemplateIds) ??
          null
        : null;
    this.activeEvidenceChain =
      this.activeChallenge?.type === "evidence_chain"
        ? this.content.pickEvidenceChainTemplate(
            this.activeChallenge.evidenceChainTemplateIds,
          ) ?? null
        : null;
    this.activeMonologue = this.content.findDailyMonologueByDay(this.currentDay) ?? null;
    this.activeBlackBoxLine = this.content.pickBlackBoxLine("package_review", {
      packageType: readyPackage.packageType,
    }) ?? null;
    this.selectedEmotion = null;
    this.emotionResponse = null;
    this.resetChallengeState();
    this.phase = "news";
    this.message = "数据包封装完成，进入新闻反馈。";
    this.programB.emit("packageCreated", { packageType: readyPackage.packageType });
    this.programB.emit("packageSealed", { packageType: readyPackage.packageType });
    this.programB.emit("transactionSealed", { packageType: readyPackage.packageType });
    this.programB.emit("newsBroadcast", { packageType: readyPackage.packageType });
    this.patchProgramB();
    return true;
  }

  chooseEmotion(choice: EmotionChoice): void {
    if (!this.activeNews) {
      return;
    }

    const previousDelta = this.selectedEmotion
      ? EMOTION_AWARENESS_DELTA[this.selectedEmotion]
      : 0;
    const nextDelta = EMOTION_AWARENESS_DELTA[choice];
    this.awarenessValue += nextDelta - previousDelta;
    this.selectedEmotion = choice;
    this.emotionResponse = this.fillText(this.activeNews.emotionResponses[choice]);
    this.message = `情绪反馈已记录，清醒值 ${this.awarenessValue}。可以进入小关卡。`;
    this.programB.emit(EMOTION_EVENTS[choice], { choice });

    if (this.activeMonologue) {
      this.programB.emit("monologueType", { day: this.currentDay });
    }

    this.patchProgramB();
  }

  beginChallenge(): boolean {
    if (!this.activeChallenge) {
      this.message = "当前日期没有可用小关卡。";
      return false;
    }

    this.phase = "challenge";
    this.message = "小关卡已启动。";
    this.resetChallengeState();
    this.activeBlackBoxLine =
      this.content.pickBlackBoxLine("challenge_intro", { day: this.currentDay }) ??
      this.activeBlackBoxLine;
    this.programB.emit("challengeBgm", { day: this.currentDay });
    this.programB.emit("blackBoxLine", { day: this.currentDay, stage: "challenge_intro" });
    this.patchProgramB();
    return true;
  }

  acceptProtocolTerm(termId: string): boolean {
    if (this.activeChallenge?.type !== "protocol_match") {
      return false;
    }

    if (this.acceptedProtocolTermIds.includes(termId)) {
      return false;
    }

    const term = this.getActiveProtocolTerms().find((item) => item.id === termId);

    if (!term) {
      this.message = "这不是当前协议伪装任务里的术语。";
      this.programB.emit("riskChanged", { reason: "unknown-protocol-term", termId });
      this.patchProgramB();
      return false;
    }

    this.acceptedProtocolTermIds = [...this.acceptedProtocolTermIds, termId];
    this.message = `已伪装：${term.riskyTerm} -> ${term.disguisedTerm}`;
    this.programB.emit("dataFlowIn", { termId });

    if (this.acceptedProtocolTermIds.length >= this.getActiveProtocolTerms().length) {
      this.completeChallenge(true);
      return true;
    }

    this.patchProgramB();
    return false;
  }

  cleanDataItem(itemId: string): boolean {
    if (this.activeChallenge?.type !== "data_cleaning") {
      return false;
    }

    const sensitiveItem = this.activeChallenge.sensitiveItems.find(
      (item) => item.id === itemId,
    );

    if (sensitiveItem) {
      if (this.cleanedSensitiveItemIds.includes(itemId)) {
        return false;
      }

      this.cleanedSensitiveItemIds = [...this.cleanedSensitiveItemIds, itemId];
      this.message = `已清理：${sensitiveItem.label}`;
      this.programB.emit("dataFlowIn", { itemId, dataType: sensitiveItem.dataType });

      if (
        this.cleanedSensitiveItemIds.length >=
        this.activeChallenge.successCondition.requiredSensitiveClicks
      ) {
        this.completeChallenge(true);
        return true;
      }

      this.patchProgramB();
      return false;
    }

    const decoyItem = this.activeChallenge.decoyItems.find((item) => item.id === itemId);

    if (!decoyItem) {
      return false;
    }

    this.cleaningMistakes += 1;
    this.message = `误点：${decoyItem.label}`;
    this.programB.emit("riskChanged", {
      reason: "data-cleaning-decoy",
      itemId,
      mistakes: this.cleaningMistakes,
    });

    if (this.cleaningMistakes > this.activeChallenge.successCondition.maxMistakes) {
      this.completeChallenge(false);
      return true;
    }

    this.patchProgramB();
    return false;
  }

  selectPuzzleFragment(fragmentId: string): boolean {
    if (this.activeChallenge?.type !== "profile_puzzle" || !this.activeProfilePuzzle) {
      return false;
    }

    if (this.acceptedPuzzleFragmentIds.includes(fragmentId)) {
      return false;
    }

    const fragment = this.activeProfilePuzzle.fragments.find(
      (item) => item.id === fragmentId,
    );

    if (!fragment) {
      return false;
    }

    if (fragment.decoy || fragment.correctOrder !== this.acceptedPuzzleFragmentIds.length + 1) {
      this.message = fragment.decoy
        ? `无效线索：${fragment.label}`
        : `顺序错误：${fragment.label}`;
      this.completeChallenge(false);
      return true;
    }

    this.acceptedPuzzleFragmentIds = [...this.acceptedPuzzleFragmentIds, fragmentId];
    this.message = `画像碎片已归位：${fragment.label}`;
    this.programB.emit("dataFlowIn", { fragmentId, order: fragment.correctOrder });

    const activeFragments = this.activeProfilePuzzle.fragments.filter(
      (item) => !item.decoy,
    );

    if (this.acceptedPuzzleFragmentIds.length >= activeFragments.length) {
      this.completeChallenge(true);
      return true;
    }

    this.patchProgramB();
    return false;
  }

  chooseNegotiationOption(optionId: string): boolean {
    if (this.activeChallenge?.type !== "buyer_negotiation" || !this.activeNegotiation) {
      return false;
    }

    const option = this.activeNegotiation.options.find((item) => item.id === optionId);

    if (!option) {
      return false;
    }

    this.selectedNegotiationOptionId = optionId;
    this.message = option.outcomeText;
    this.programB.emit("transactionSuccess", {
      packageType: this.activeNegotiation.packageType,
      optionId,
    });
    this.programB.emit("blackBoxLine", {
      stage: "transaction_success",
      optionId,
    });
    this.completeChallenge(true);
    return true;
  }

  choosePublicOpinionTactic(tacticId: string): boolean {
    if (this.activeChallenge?.type !== "public_opinion" || !this.activePublicOpinion) {
      return false;
    }

    const tactic = this.activePublicOpinion.tactics.find((item) => item.id === tacticId);

    if (!tactic) {
      return false;
    }

    this.selectedPublicOpinionTacticId = tacticId;
    const safe = this.isSafePublicOpinionTactic(tactic);

    this.message = safe
      ? `舆论改写已发布：${tactic.line}`
      : `风险话术引发追问：${this.activePublicOpinion.counterCue}`;
    this.programB.emit("publicOpinionPulse", {
      scriptId: this.activePublicOpinion.id,
      tacticId,
      safe,
    });

    this.completeChallenge(safe);
    return true;
  }

  markProtocolScanClause(clauseId: string): boolean {
    if (this.activeChallenge?.type !== "protocol_scan" || !this.activeProtocolScan) {
      return false;
    }

    if (this.markedProtocolScanClauseIds.includes(clauseId)) {
      return false;
    }

    const clause = this.activeProtocolScan.riskClauses.find((item) => item.id === clauseId);

    if (!clause) {
      this.message = "这不是当前协议里的高风险条款。";
      this.programB.emit("riskChanged", { reason: "protocol-scan-unknown-clause", clauseId });
      this.patchProgramB();
      return false;
    }

    this.markedProtocolScanClauseIds = [...this.markedProtocolScanClauseIds, clauseId];
    this.message = `已标记高风险条款：${clause.text}`;
    this.programB.emit("dataFlowIn", { task: "protocol-scan-clause", clauseId });

    return this.maybeCompleteProtocolScan();
  }

  matchProtocolScanFlow(flowId: string): boolean {
    if (this.activeChallenge?.type !== "protocol_scan" || !this.activeProtocolScan) {
      return false;
    }

    if (this.matchedProtocolScanFlowIds.includes(flowId)) {
      return false;
    }

    const flow = this.activeProtocolScan.dataFlowMatches.find((item) => item.id === flowId);

    if (!flow) {
      return false;
    }

    this.matchedProtocolScanFlowIds = [...this.matchedProtocolScanFlowIds, flowId];
    this.message = `数据流向已确认：${flow.source} -> ${flow.destination}`;
    this.programB.emit("dataFlowIn", { task: "protocol-scan-flow", flowId });

    return this.maybeCompleteProtocolScan();
  }

  findProtocolScanHiddenClause(): boolean {
    if (this.activeChallenge?.type !== "protocol_scan" || !this.activeProtocolScan) {
      return false;
    }

    if (this.hiddenProtocolScanClauseFound) {
      return false;
    }

    this.hiddenProtocolScanClauseFound = true;
    this.message = `隐藏条款已发现：${this.activeProtocolScan.hiddenClause.text}`;
    this.programB.emit("blackBoxLine", {
      task: "protocol-scan-hidden-clause",
      hiddenClauseId: this.activeProtocolScan.hiddenClause.id,
    });

    return this.maybeCompleteProtocolScan();
  }

  answerProtocolScanRisk(level: RiskLevel): boolean {
    if (this.activeChallenge?.type !== "protocol_scan" || !this.activeProtocolScan) {
      return false;
    }

    this.selectedProtocolScanRiskLevel = level;
    this.message =
      level === this.activeProtocolScan.riskQuestion.answer
        ? "风险等级判断正确。"
        : "风险等级判断偏离，但仍会计入最终评分。";
    this.programB.emit("riskChanged", {
      task: "protocol-scan-risk-answer",
      selected: level,
      expected: this.activeProtocolScan.riskQuestion.answer,
    });

    return this.maybeCompleteProtocolScan();
  }

  completeChallenge(succeeded: boolean): void {
    const completedDay = this.currentDay;
    const lastPlayableDay = PLAYABLE_DAYS[PLAYABLE_DAYS.length - 1];
    this.challengeStatus = succeeded ? "success" : "failed";
    this.activeBlackBoxLine =
      this.content.pickBlackBoxLine(
        succeeded ? "challenge_success" : "challenge_fail",
        { day: completedDay },
      ) ?? this.activeBlackBoxLine;
    this.programB.emit(succeeded ? "challengeSuccess" : "challengeFail", {
      day: completedDay,
    });
    this.programB.emit("blackBoxLine", {
      day: completedDay,
      succeeded,
    });
    this.programB.emit("bgmSilence", { reason: "challenge-complete" });
    if (succeeded) {
      if (!this.completedChallengeDays.includes(completedDay)) {
        this.completedChallengeDays = [...this.completedChallengeDays, completedDay];
      }

      this.dayIndex = Math.min(this.dayIndex + 1, PLAYABLE_DAYS.length - 1);
    }

    this.phase = "workbench";
    this.message = succeeded
      ? completedDay === lastPlayableDay
        ? `Day ${completedDay} 完成，结局系统原型已解锁：${this.getEndingPrototype().unlockedPathLabel}。`
        : `Day ${completedDay} 完成，Day ${this.currentDay} 已解锁。`
      : `Day ${completedDay} 未通过，返回工作台调整后重试。`;

    if (succeeded && completedDay === lastPlayableDay) {
      this.programB.emit("endingTriggered", this.getEndingPrototype());
    }

    this.patchProgramB();
  }

  private get currentDay(): number {
    return PLAYABLE_DAYS[this.dayIndex];
  }

  private getWorkbenchCards(): readonly CardTemplate[] {
    const cardTypes: readonly DataType[] = [
      "location",
      "consumption",
      "social",
      "health",
      "biometric",
      "contact_graph",
    ];
    const cards = this.content.getCardTemplates();
    const selectedByType = cardTypes
      .map((dataType) => cards.find((card) => card.dataType === dataType))
      .filter((card): card is CardTemplate => Boolean(card));
    const seen = new Set<string>();

    return [...selectedByType, ...cards]
      .filter((card) => {
        if (seen.has(card.id)) {
          return false;
        }

        seen.add(card.id);
        return true;
      })
      .slice(0, 6);
  }

  private pickInitialCardIds(): string[] {
    const requiredTypes: readonly DataType[] = ["location", "consumption", "social"];
    const cards = this.getWorkbenchCards();

    return requiredTypes
      .map((dataType) => cards.find((card) => card.dataType === dataType)?.id)
      .filter((cardId): cardId is string => Boolean(cardId))
      .slice(0, MAX_SLOT_COUNT);
  }

  private resetChallengeState(): void {
    this.challengeStatus = "playing";
    this.acceptedProtocolTermIds = [];
    this.cleanedSensitiveItemIds = [];
    this.cleaningMistakes = 0;
    this.acceptedPuzzleFragmentIds = [];
    this.selectedNegotiationOptionId = null;
    this.selectedPublicOpinionTacticId = null;
    this.markedProtocolScanClauseIds = [];
    this.matchedProtocolScanFlowIds = [];
    this.hiddenProtocolScanClauseFound = false;
    this.selectedProtocolScanRiskLevel = null;
    this.collectedEvidenceFragmentIds = [];
    this.connectedEvidenceConnectionIds = [];
    this.evidenceUploadComplete = false;
  }

  private getMiniGameState(): WeekOneMiniGameState {
    const protocolTerms = this.getActiveProtocolTerms();
    const cleaningItems = this.getCleaningItems();
    const puzzleFragments = this.activeProfilePuzzle?.fragments ?? [];
    const negotiationOptions = this.activeNegotiation?.options ?? [];
    const publicOpinionTactics = this.activePublicOpinion?.tactics ?? [];
    const protocolScanScore = this.getProtocolScanScore();
    const evidenceConnections = this.activeEvidenceChain?.connections ?? [];
    const evidenceFragments = this.activeEvidenceChain?.fragments ?? [];

    return {
      status: this.challengeStatus,
      progressText: this.getChallengeProgressText(),
      protocolTerms,
      acceptedProtocolTermIds: [...this.acceptedProtocolTermIds],
      cleaningItems,
      cleanedSensitiveItemIds: [...this.cleanedSensitiveItemIds],
      cleaningMistakes: this.cleaningMistakes,
      maxCleaningMistakes:
        this.activeChallenge?.type === "data_cleaning"
          ? this.activeChallenge.successCondition.maxMistakes
          : 0,
      puzzleFragments,
      acceptedPuzzleFragmentIds: [...this.acceptedPuzzleFragmentIds],
      expectedPuzzleOrder: this.acceptedPuzzleFragmentIds.length + 1,
      negotiationOptions,
      selectedNegotiationOptionId: this.selectedNegotiationOptionId,
      publicOpinionScript: this.activePublicOpinion,
      publicOpinionTactics,
      selectedPublicOpinionTacticId: this.selectedPublicOpinionTacticId,
      protocolScanTemplate: this.activeProtocolScan,
      markedProtocolScanClauseIds: [...this.markedProtocolScanClauseIds],
      matchedProtocolScanFlowIds: [...this.matchedProtocolScanFlowIds],
      hiddenProtocolScanClauseFound: this.hiddenProtocolScanClauseFound,
      selectedProtocolScanRiskLevel: this.selectedProtocolScanRiskLevel,
      protocolScanScore,
      evidenceChainTemplate: this.activeEvidenceChain,
      evidenceFragments,
      collectedEvidenceFragmentIds: [...this.collectedEvidenceFragmentIds],
      evidenceConnections,
      connectedEvidenceConnectionIds: [...this.connectedEvidenceConnectionIds],
      evidenceUploadComplete: this.evidenceUploadComplete,
      evidencePath: this.getEndingPrototype().unlockedPath,
    };
  }

  private getActiveProtocolTerms(): readonly ProtocolTerm[] {
    if (this.activeChallenge?.type !== "protocol_match") {
      return [];
    }

    const termIds = new Set(this.activeChallenge.protocolTermIds.slice(0, 4));

    return this.content
      .getProtocolTerms()
      .filter((term) => termIds.has(term.id));
  }

  private getCleaningItems(): readonly DataCleaningSliceItem[] {
    if (this.activeChallenge?.type !== "data_cleaning") {
      return [];
    }

    return [
      ...this.activeChallenge.sensitiveItems.map((item) =>
        this.toCleaningItem(item, "sensitive"),
      ),
      ...this.activeChallenge.decoyItems.map((item) =>
        this.toCleaningItem(item, "decoy"),
      ),
    ];
  }

  private toCleaningItem(
    item: DataCleaningSensitiveItem | DataCleaningDecoyItem,
    kind: "sensitive" | "decoy",
  ): DataCleaningSliceItem {
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      kind,
      meta:
        kind === "sensitive"
          ? (item as DataCleaningSensitiveItem).dataType
          : (item as DataCleaningDecoyItem).trapType,
    };
  }

  private getChallengeProgressText(): string {
    if (!this.activeChallenge) {
      return "等待小关卡启动。";
    }

    switch (this.activeChallenge.type) {
      case "protocol_match":
        return `${this.acceptedProtocolTermIds.length}/${this.getActiveProtocolTerms().length} 条协议话术已伪装`;
      case "data_cleaning":
        return `${this.cleanedSensitiveItemIds.length}/${this.activeChallenge.successCondition.requiredSensitiveClicks} 个敏感项已清理，误点 ${this.cleaningMistakes}/${this.activeChallenge.successCondition.maxMistakes}`;
      case "profile_puzzle":
        return `${this.acceptedPuzzleFragmentIds.length}/${this.getActivePuzzleFragmentCount()} 个画像碎片已归位`;
      case "buyer_negotiation":
        return this.selectedNegotiationOptionId
          ? "谈判话术已选择"
          : "选择任一谈判话术推进交易";
      case "public_opinion":
        return this.selectedPublicOpinionTacticId
          ? "舆论改写话术已发布"
          : "从 3 个话术中选择唯一安全改写";
      case "protocol_scan":
        return `协议扫描评分 ${this.getProtocolScanScore()}/100，达成 75 分即可通关`;
      case "evidence_chain":
        return this.getEvidenceChainProgressText();
    }
  }

  private pickPublicOpinionScript(packageType: string): PublicOpinionScript | null {
    if (this.activeChallenge?.type !== "public_opinion") {
      return null;
    }

    const allowedIds = new Set(this.activeChallenge.publicOpinionScriptIds);
    const packageScripts = this.content
      .findPublicOpinionScriptsForPackage(packageType)
      .filter((script) => allowedIds.has(script.id));

    if (packageScripts.length > 0) {
      return packageScripts[0];
    }

    return (
      this.content
        .getPublicOpinionScripts()
        .find((script) => allowedIds.has(script.id)) ?? null
    );
  }

  private isSafePublicOpinionTactic(tactic: PublicOpinionTactic): boolean {
    return tactic.label === "安全改写" || tactic.playerPrompt.includes("安全");
  }

  private getActivePuzzleFragmentCount(): number {
    return this.activeProfilePuzzle?.fragments.filter((item) => !item.decoy).length ?? 0;
  }

  private getProtocolScanScore(): number {
    if (this.activeChallenge?.type !== "protocol_scan" || !this.activeProtocolScan) {
      return 0;
    }

    let score = 0;
    const condition = this.activeChallenge.successCondition;

    if (this.markedProtocolScanClauseIds.length >= condition.requiredRiskClauseMarks) {
      score += 25;
    }

    if (this.matchedProtocolScanFlowIds.length >= condition.requiredDataFlowMatches) {
      score += 25;
    }

    if (this.hiddenProtocolScanClauseFound) {
      score += 25;
    }

    if (this.selectedProtocolScanRiskLevel === this.activeProtocolScan.riskQuestion.answer) {
      score += 25;
    }

    return score;
  }

  private maybeCompleteProtocolScan(): boolean {
    if (this.activeChallenge?.type !== "protocol_scan") {
      return false;
    }

    const condition = this.activeChallenge.successCondition;
    const allTasksTouched =
      this.markedProtocolScanClauseIds.length >= condition.requiredRiskClauseMarks &&
      this.matchedProtocolScanFlowIds.length >= condition.requiredDataFlowMatches &&
      this.hiddenProtocolScanClauseFound &&
      this.selectedProtocolScanRiskLevel !== null;

    if (!allTasksTouched) {
      this.patchProgramB();
      return false;
    }

    this.completeChallenge(this.getProtocolScanScore() >= condition.passingScore);
    return true;
  }

  collectEvidenceFragment(fragmentId: string): boolean {
    if (this.activeChallenge?.type !== "evidence_chain" || !this.activeEvidenceChain) {
      return false;
    }

    if (this.getEndingPrototype().unlockedPath !== "evidence_chain") {
      return false;
    }

    if (this.collectedEvidenceFragmentIds.includes(fragmentId)) {
      return false;
    }

    const fragment = this.activeEvidenceChain.fragments.find((item) => item.id === fragmentId);

    if (!fragment) {
      return false;
    }

    this.collectedEvidenceFragmentIds = [...this.collectedEvidenceFragmentIds, fragmentId];
    this.message = `证据已纳入链条：${fragment.title}`;
    this.programB.emit("dataFlowIn", {
      task: "evidence-fragment",
      fragmentId,
      day: fragment.day,
    });
    this.patchProgramB();
    return false;
  }

  collectEvidenceDay(day: number): boolean {
    if (this.activeChallenge?.type !== "evidence_chain" || !this.activeEvidenceChain) {
      return false;
    }

    if (this.getEndingPrototype().unlockedPath !== "evidence_chain") {
      return false;
    }

    const dayFragments = this.activeEvidenceChain.fragments.filter(
      (fragment) => fragment.day === day,
    );
    const newFragmentIds = dayFragments
      .map((fragment) => fragment.id)
      .filter((fragmentId) => !this.collectedEvidenceFragmentIds.includes(fragmentId));

    if (newFragmentIds.length === 0) {
      return false;
    }

    this.collectedEvidenceFragmentIds = [
      ...this.collectedEvidenceFragmentIds,
      ...newFragmentIds,
    ];
    this.message = `Day ${day} 的 ${newFragmentIds.length} 件证据已纳入证据链。`;
    this.programB.emit("dataFlowIn", {
      task: "evidence-day-folder",
      day,
      fragmentCount: newFragmentIds.length,
    });
    this.patchProgramB();
    return false;
  }

  connectEvidenceChain(connectionId: string): boolean {
    if (this.activeChallenge?.type !== "evidence_chain" || !this.activeEvidenceChain) {
      return false;
    }

    if (this.getEndingPrototype().unlockedPath !== "evidence_chain") {
      return false;
    }

    if (this.connectedEvidenceConnectionIds.includes(connectionId)) {
      return false;
    }

    const connection = this.activeEvidenceChain.connections.find(
      (item) => item.id === connectionId,
    );

    if (!connection) {
      return false;
    }

    const hasEndpoints =
      this.collectedEvidenceFragmentIds.includes(connection.fromFragmentId) &&
      this.collectedEvidenceFragmentIds.includes(connection.toFragmentId);

    if (!hasEndpoints) {
      this.message = "这条连接的两端证据还没有全部纳入证据链。";
      this.programB.emit("riskChanged", {
        reason: "evidence-connection-missing-fragments",
        connectionId,
      });
      this.patchProgramB();
      return false;
    }

    this.connectedEvidenceConnectionIds = [
      ...this.connectedEvidenceConnectionIds,
      connectionId,
    ];
    this.message = `关键连接已确认：${connection.label}`;
    this.programB.emit("dataFlowIn", {
      task: "evidence-connection",
      connectionId,
    });
    this.patchProgramB();
    return false;
  }

  submitEvidenceChain(): boolean {
    if (this.activeChallenge?.type !== "evidence_chain" || !this.activeEvidenceChain) {
      return false;
    }

    if (this.getEndingPrototype().unlockedPath === "final_package") {
      this.evidenceUploadComplete = true;
      this.message = this.fillText(this.activeEvidenceChain.finalPackage.outcomeText);
      this.completeChallenge(true);
      return true;
    }

    const condition = this.activeChallenge.successCondition;
    const ready =
      this.collectedEvidenceFragmentIds.length >= condition.requiredFragments &&
      this.connectedEvidenceConnectionIds.length >= condition.requiredConnections;

    if (!ready) {
      this.message = this.activeEvidenceChain.failText;
      this.programB.emit("riskChanged", {
        reason: "evidence-chain-incomplete",
        collected: this.collectedEvidenceFragmentIds.length,
        connected: this.connectedEvidenceConnectionIds.length,
      });
      this.patchProgramB();
      return false;
    }

    this.evidenceUploadComplete = true;
    this.message = this.activeEvidenceChain.uploadText;
    this.completeChallenge(true);
    return true;
  }

  private getEvidenceChainProgressText(): string {
    if (!this.activeEvidenceChain) {
      return "等待证据链模板。";
    }

    if (this.getEndingPrototype().unlockedPath === "final_package") {
      return `${this.activeEvidenceChain.lowAwarenessPathTitle} · ${this.activeEvidenceChain.lockedReason}`;
    }

    return `${this.collectedEvidenceFragmentIds.length}/${this.activeEvidenceChain.fragments.length} 件证据，${this.connectedEvidenceConnectionIds.length}/${this.activeEvidenceChain.connections.length} 条连接`;
  }

  private getEndingPrototype(): EndingPrototypeState {
    const threshold = 5;
    const awarenessValue = this.awarenessValue;
    const unlockedPath: EndingPath =
      awarenessValue >= threshold ? "evidence_chain" : "final_package";
    const isHighAwareness = unlockedPath === "evidence_chain";

    return {
      awarenessValue,
      threshold,
      unlockedPath,
      unlockedPathLabel: isHighAwareness ? "重组证据链" : "最后的数据包",
      lockedPathLabel: isHighAwareness ? "最后的数据包" : "重组证据链",
      lockedReason: isHighAwareness ? null : "[数据损坏] 清醒值不足，无法解码该路径",
      reportGrade: isHighAwareness ? "B+" : "F",
    };
  }

  private patchProgramB(): void {
    const endingPrototype = this.getEndingPrototype();

    this.programB.patchState({
      phase: this.phase,
      counters: {
        day: this.currentDay,
        selectedCards: this.selectedCardIds.length,
        awarenessValue: endingPrototype.awarenessValue,
        protocolScanScore: this.getProtocolScanScore(),
      },
      data: {
        selectedCardIds: [...this.selectedCardIds],
        activePackageType: this.activePackage?.packageType ?? null,
        selectedEmotion: this.selectedEmotion,
        endingPrototype,
        message: this.message,
      },
    });
  }
}
