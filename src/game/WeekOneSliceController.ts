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
  EndingReportTemplate,
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
export type EndingReportGrade = "F" | "B+";

export interface EndingPrototypeState {
  readonly awarenessValue: number;
  readonly threshold: number;
  readonly unlockedPath: EndingPath;
  readonly unlockedPathLabel: string;
  readonly lockedPathLabel: string;
  readonly lockedReason: string | null;
  readonly reportGrade: "F" | "B+";
}

export interface WeekOneEmotionLog {
  readonly day: number;
  readonly choice: EmotionChoice;
  readonly delta: number;
}

export interface WeekOneSoldLogEntry {
  readonly day: number;
  readonly packType: string;
  readonly buyer: string;
  readonly price: number;
  readonly userIds: readonly string[];
  readonly dataTypes: readonly DataType[];
}

export interface WeekOneEndingReport {
  readonly title: string;
  readonly subtitle: string;
  readonly nickname: string;
  readonly durationText: string;
  readonly endingTitle: string;
  readonly endingPath: EndingPath;
  readonly grade: EndingReportGrade;
  readonly summary: string;
  readonly ratingComment: string;
  readonly adviceText: string;
  readonly qrPrompt: string;
  readonly awarenessValue: number;
  readonly awarenessThreshold: number;
  readonly soldDataCount: number;
  readonly packageCount: number;
  readonly buyerCount: number;
  readonly affectedUserCount: number;
  readonly dataTypes: readonly string[];
  readonly dataUses: readonly string[];
  readonly badges: readonly string[];
  readonly shareText: string;
  readonly sharePresets: readonly string[];
  readonly generatedAt: string;
}

export interface WeekOneSaveState {
  readonly schemaVersion: 1;
  readonly day: number;
  readonly clarity_score: number;
  readonly emotion_history: readonly WeekOneEmotionLog[];
  readonly inventory: readonly string[];
  readonly sold_log: readonly WeekOneSoldLogEntry[];
  readonly news_seen: readonly string[];
  readonly badges: readonly string[];
  readonly completed_challenge_days: readonly number[];
  readonly nickname: string;
  readonly tutorial_done: boolean;
  readonly random_seed: number;
  readonly last_save_time: string;
  readonly ending_report: WeekOneEndingReport | null;
}

export type WeekOneSaveStatus = "unavailable" | "loaded" | "saved" | "cleared" | "error";

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
  readonly endingReport: WeekOneEndingReport;
  readonly saveState: WeekOneSaveState | null;
  readonly saveStatus: WeekOneSaveStatus;
  readonly shareMessage: string | null;
  readonly message: string;
}

const PLAYABLE_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const MAX_SLOT_COUNT = 3;
const SAVE_STORAGE_KEY = "program-c-week-one-save-v1";

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
  private emotionHistory: WeekOneEmotionLog[] = [];
  private soldLog: WeekOneSoldLogEntry[] = [];
  private newsSeen: string[] = [];
  private saveStatus: WeekOneSaveStatus = "unavailable";
  private lastSaveState: WeekOneSaveState | null = null;
  private endingReport: WeekOneEndingReport | null = null;
  private shareMessage: string | null = null;
  private completedChallengeDays: number[] = [];
  private message = "选择 3 张数据卡，封装第一个可用数据包。";

  constructor(
    private readonly content: ContentRepository,
    private readonly programB: ProgramBBridge,
  ) {
    this.user = content.getUsers()[0];
    const savedState = this.readSaveState();
    this.selectedCardIds = savedState?.inventory.length
      ? [...savedState.inventory].slice(0, MAX_SLOT_COUNT)
      : this.pickInitialCardIds();

    if (savedState) {
      const savedDayIndex = PLAYABLE_DAYS.findIndex((day) => day === savedState.day);
      this.dayIndex = Math.max(0, savedDayIndex);
      this.awarenessValue = savedState.clarity_score;
      this.emotionHistory = [...savedState.emotion_history];
      this.soldLog = [...savedState.sold_log];
      this.newsSeen = [...savedState.news_seen];
      this.completedChallengeDays = [...savedState.completed_challenge_days];
      this.endingReport = savedState.ending_report;
      this.lastSaveState = savedState;
      this.saveStatus = "loaded";
      this.message = `已读取本地存档，继续 Day ${this.currentDay}。`;
    }

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
      endingReport: this.getEndingReport(),
      saveState: this.lastSaveState,
      saveStatus: this.saveStatus,
      shareMessage: this.shareMessage,
      message: this.message,
    };
  }

  fillText(template: string): string {
    return this.content.fillVariables(template, { user: this.user });
  }

  getEndingReport(): WeekOneEndingReport {
    return this.endingReport ?? this.buildEndingReport();
  }

  copyShareText(): boolean {
    const shareText = this.getEndingReport().shareText;

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      this.shareMessage = "当前环境无法写入剪贴板，可手动复制分享文案。";
      this.patchProgramB();
      return false;
    }

    void navigator.clipboard.writeText(shareText).then(
      () => {
        this.shareMessage = "分享文案已复制到剪贴板。";
        this.patchProgramB();
      },
      () => {
        this.shareMessage = "剪贴板写入失败，可手动复制分享文案。";
        this.patchProgramB();
      },
    );

    this.shareMessage = "正在复制分享文案。";
    this.patchProgramB();
    return true;
  }

  clearSave(): void {
    const storage = this.getStorage();

    if (!storage) {
      this.saveStatus = "unavailable";
      this.message = "当前环境没有可用本地存档。";
      this.patchProgramB({ persist: false });
      return;
    }

    try {
      storage.removeItem(SAVE_STORAGE_KEY);
      this.lastSaveState = null;
      this.saveStatus = "cleared";
      this.message = "本地存档已清除。";
    } catch {
      this.saveStatus = "error";
      this.message = "清除本地存档失败。";
    }

    this.patchProgramB({ persist: false });
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

  placeCardInSlot(cardId: string, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= MAX_SLOT_COUNT) {
      this.message = "目标卡槽不存在。";
      this.programB.emit("riskChanged", { reason: "invalid-slot-index", cardId, slotIndex });
      this.patchProgramB();
      return false;
    }

    const cardExists = this.getWorkbenchCards().some((card) => card.id === cardId);

    if (!cardExists) {
      this.message = "这张数据卡不在当前工作台卡池里。";
      this.programB.emit("riskChanged", { reason: "unknown-workbench-card", cardId });
      this.patchProgramB();
      return false;
    }

    const nextCardIds = [...this.selectedCardIds];
    const sourceSlotIndex = nextCardIds.indexOf(cardId);
    const targetCardId = nextCardIds[slotIndex] ?? null;

    if (sourceSlotIndex === slotIndex) {
      this.message = `数据卡已在槽位 ${slotIndex + 1}。`;
      this.patchProgramB();
      return false;
    }

    if (sourceSlotIndex >= 0 && targetCardId) {
      nextCardIds[sourceSlotIndex] = targetCardId;
      nextCardIds[slotIndex] = cardId;
      this.message = `已交换槽位 ${sourceSlotIndex + 1} 和槽位 ${slotIndex + 1}。`;
    } else {
      if (sourceSlotIndex >= 0) {
        nextCardIds.splice(sourceSlotIndex, 1);
      }

      if (slotIndex >= nextCardIds.length) {
        nextCardIds.push(cardId);
      } else {
        nextCardIds[slotIndex] = cardId;
      }

      this.message = targetCardId
        ? `槽位 ${slotIndex + 1} 已替换为新的数据卡。`
        : `数据卡已放入槽位 ${slotIndex + 1}。`;
    }

    this.selectedCardIds = nextCardIds.slice(0, MAX_SLOT_COUNT);
    this.programB.emit("cardMovedToSlot", { cardId, slotIndex });
    this.patchProgramB();
    return true;
  }

  removeCardFromSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.selectedCardIds.length) {
      this.message = "这个槽位里没有可移除的数据卡。";
      this.patchProgramB();
      return false;
    }

    const [cardId] = this.selectedCardIds.splice(slotIndex, 1);
    this.selectedCardIds = [...this.selectedCardIds];
    this.message = `已清空槽位 ${slotIndex + 1}。`;
    this.programB.emit("cardMovedToSlot", { cardId, slotIndex: -1 });
    this.patchProgramB();
    return true;
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
    this.recordSoldPackage(readyPackage);

    if (this.activeNews && !this.newsSeen.includes(this.activeNews.id)) {
      this.newsSeen = [...this.newsSeen, this.activeNews.id];
    }

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
    this.emotionHistory = [
      ...this.emotionHistory.filter((item) => item.day !== this.currentDay),
      {
        day: this.currentDay,
        choice,
        delta: nextDelta,
      },
    ].sort((left, right) => left.day - right.day);
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

    if (succeeded && completedDay === lastPlayableDay) {
      this.endingReport = this.buildEndingReport();
    }

    this.phase = "workbench";
    this.message = succeeded
      ? completedDay === lastPlayableDay
        ? `Day ${completedDay} 完成，《个人数据泄露报告》已生成：评级 ${this.getEndingReport().grade}。`
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

  private recordSoldPackage(readyPackage: PackagePreview): void {
    const selectedCards = readyPackage.selectedCards;
    const userIds = [...new Set(selectedCards.map((card) => card.relatedUserId))];
    const dataTypes = [...new Set(selectedCards.map((card) => card.dataType))];
    const buyer = readyPackage.buyers[0];
    const price =
      readyPackage.recipe.basePrice ??
      readyPackage.recipe.priceRange?.[0] ??
      0;

    this.soldLog = [
      ...this.soldLog.filter((entry) => entry.day !== this.currentDay),
      {
        day: this.currentDay,
        packType: readyPackage.packageType,
        buyer: buyer?.name ?? "未知买家",
        price,
        userIds,
        dataTypes,
      },
    ].sort((left, right) => left.day - right.day);
  }

  private buildEndingReport(): WeekOneEndingReport {
    const endingPrototype = this.getEndingPrototype();
    const template = this.getEndingReportTemplate();
    const endingCopy =
      template.endings.find((ending) => ending.path === endingPrototype.unlockedPath) ??
      template.endings[0];
    const badges = this.getEarnedBadges();
    const soldDataCount = this.soldLog.reduce(
      (sum, entry) => sum + entry.dataTypes.length,
      0,
    );
    const affectedUserCount = new Set(this.soldLog.flatMap((entry) => entry.userIds)).size;
    const buyerCount = new Set(this.soldLog.map((entry) => entry.buyer)).size;
    const generatedAt = new Date().toISOString();
    const shareContext = {
      soldDataCount,
      affectedUserCount,
      grade: endingCopy.grade,
    };

    return {
      title: template.title,
      subtitle: template.subtitle,
      nickname: this.user.name,
      durationText: template.durationText,
      endingTitle: endingCopy.title,
      endingPath: endingCopy.path,
      grade: endingCopy.grade,
      summary: endingCopy.summary,
      ratingComment: endingCopy.ratingComment,
      adviceText: template.adviceText,
      qrPrompt: template.qrPrompt,
      awarenessValue: endingPrototype.awarenessValue,
      awarenessThreshold: endingPrototype.threshold,
      soldDataCount,
      packageCount: this.soldLog.length,
      buyerCount,
      affectedUserCount,
      dataTypes: template.dataTypes,
      dataUses: template.dataUses,
      badges,
      shareText: this.fillReportPlaceholders(endingCopy.shareText, shareContext),
      sharePresets: template.sharePresets.map((preset) =>
        this.fillReportPlaceholders(preset, shareContext),
      ),
      generatedAt,
    };
  }

  private getEndingReportTemplate(): EndingReportTemplate {
    return (
      this.content.getEndingReportTemplates()[0] ?? {
        id: "fallback-ending-report",
        title: "个人数据泄露报告",
        subtitle: "七日试用期记录",
        durationText: "在职时长：7天",
        dataTypes: ["位置轨迹", "消费记录", "社交关系", "健康数据", "生物特征", "通讯录"],
        dataUses: ["精准广告", "保险评估", "招聘筛选", "信贷审批", "精准诈骗"],
        adviceText: "建议重新学习数据隐私保护知识。",
        qrPrompt: "扫码进入监控室，看看你能选择清醒到第几天",
        sharePresets: [],
        endings: [
          {
            path: "final_package",
            title: "替罪羊",
            grade: "F",
            summary: "你的数据包进入了买家网络。",
            ratingComment: "你见证了数据作恶的全流程。",
            shareText: "我生成了自己的《个人数据泄露报告》。",
          },
          {
            path: "evidence_chain",
            title: "举报者",
            grade: "B+",
            summary: "证据链已提交。",
            ratingComment: "你选择停下。",
            shareText: "我举报了我的公司。",
          },
        ],
      }
    );
  }

  private fillReportPlaceholders(
    template: string,
    values: {
      readonly soldDataCount: number;
      readonly affectedUserCount: number;
      readonly grade: EndingReportGrade;
    },
  ): string {
    return template
      .replace(/\{soldDataCount\}/g, String(values.soldDataCount))
      .replace(/\{affectedUserCount\}/g, String(values.affectedUserCount))
      .replace(/\{grade\}/g, values.grade);
  }

  private getEarnedBadges(): readonly string[] {
    return this.completedChallengeDays
      .map((day) => this.content.findChallengeByDay(day)?.badge)
      .filter((badge): badge is string => Boolean(badge));
  }

  private createSaveState(savedAt = new Date().toISOString()): WeekOneSaveState {
    return {
      schemaVersion: 1,
      day: this.currentDay,
      clarity_score: this.awarenessValue,
      emotion_history: [...this.emotionHistory],
      inventory: [...this.selectedCardIds],
      sold_log: [...this.soldLog],
      news_seen: [...this.newsSeen],
      badges: [...this.getEarnedBadges()],
      completed_challenge_days: [...this.completedChallengeDays],
      nickname: this.user.name,
      tutorial_done: true,
      random_seed: 20260718,
      last_save_time: savedAt,
      ending_report: this.endingReport,
    };
  }

  private persistSaveState(state: WeekOneSaveState): void {
    const storage = this.getStorage();

    if (!storage) {
      this.saveStatus = "unavailable";
      this.lastSaveState = null;
      return;
    }

    try {
      storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
      this.lastSaveState = state;
      this.saveStatus = "saved";
    } catch {
      this.saveStatus = "error";
    }
  }

  private readSaveState(): WeekOneSaveState | null {
    const storage = this.getStorage();

    if (!storage) {
      this.saveStatus = "unavailable";
      return null;
    }

    try {
      const raw = storage.getItem(SAVE_STORAGE_KEY);

      if (!raw) {
        this.saveStatus = "unavailable";
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<WeekOneSaveState>;

      if (parsed.schemaVersion !== 1 || typeof parsed.day !== "number") {
        this.saveStatus = "error";
        return null;
      }

      return {
        schemaVersion: 1,
        day: parsed.day,
        clarity_score: parsed.clarity_score ?? 0,
        emotion_history: parsed.emotion_history ?? [],
        inventory: parsed.inventory ?? [],
        sold_log: parsed.sold_log ?? [],
        news_seen: parsed.news_seen ?? [],
        badges: parsed.badges ?? [],
        completed_challenge_days: parsed.completed_challenge_days ?? [],
        nickname: parsed.nickname ?? this.user.name,
        tutorial_done: parsed.tutorial_done ?? true,
        random_seed: parsed.random_seed ?? 20260718,
        last_save_time: parsed.last_save_time ?? new Date().toISOString(),
        ending_report: parsed.ending_report ?? null,
      };
    } catch {
      this.saveStatus = "error";
      return null;
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage;
    } catch {
      return null;
    }
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

  private patchProgramB(options: { readonly persist?: boolean } = {}): void {
    const endingPrototype = this.getEndingPrototype();
    const shouldPersist = options.persist ?? true;
    const saveState = shouldPersist ? this.createSaveState() : this.lastSaveState;

    if (saveState && shouldPersist) {
      this.persistSaveState(saveState);
    }

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
        endingReport: this.getEndingReport(),
        saveState: this.lastSaveState,
        saveStatus: this.saveStatus,
        shareMessage: this.shareMessage,
        message: this.message,
      },
    });
  }
}
