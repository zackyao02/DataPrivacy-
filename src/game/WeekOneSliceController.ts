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
  NewsTemplate,
  PackagePreview,
  ProfilePuzzle,
  ProfilePuzzleFragment,
  ProtocolTerm,
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
  readonly activeMonologue: DailyMonologue | null;
  readonly activeBlackBoxLine: BlackBoxLine | null;
  readonly selectedEmotion: EmotionChoice | null;
  readonly emotionResponse: string | null;
  readonly miniGame: WeekOneMiniGameState;
  readonly message: string;
}

const WEEK_ONE_DAYS = [1, 2, 4, 5] as const;
const MAX_SLOT_COUNT = 3;

const EMOTION_EVENTS: Record<EmotionChoice, string> = {
  empathy: "emotionEmpathySelected",
  anger: "emotionAngerSelected",
  numbness: "emotionNumbnessSelected",
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
      activeMonologue: this.activeMonologue,
      activeBlackBoxLine: this.activeBlackBoxLine,
      selectedEmotion: this.selectedEmotion,
      emotionResponse: this.emotionResponse,
      miniGame: this.getMiniGameState(),
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

    this.selectedEmotion = choice;
    this.emotionResponse = this.fillText(this.activeNews.emotionResponses[choice]);
    this.message = "情绪反馈已记录，可以进入小关卡。";
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

  completeChallenge(succeeded: boolean): void {
    const completedDay = this.currentDay;
    const lastWeekOneDay = WEEK_ONE_DAYS[WEEK_ONE_DAYS.length - 1];
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
      this.dayIndex = Math.min(this.dayIndex + 1, WEEK_ONE_DAYS.length - 1);
    }

    this.phase = "workbench";
    this.message = succeeded
      ? completedDay === lastWeekOneDay
        ? `Day ${completedDay} 完成，Week 1 垂直切片已完成。`
        : `Day ${completedDay} 完成，Day ${this.currentDay} 已解锁。`
      : `Day ${completedDay} 未通过，返回工作台调整后重试。`;
    this.patchProgramB();
  }

  private get currentDay(): number {
    return WEEK_ONE_DAYS[this.dayIndex];
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
  }

  private getMiniGameState(): WeekOneMiniGameState {
    const protocolTerms = this.getActiveProtocolTerms();
    const cleaningItems = this.getCleaningItems();
    const puzzleFragments = this.activeProfilePuzzle?.fragments ?? [];
    const negotiationOptions = this.activeNegotiation?.options ?? [];

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
    }
  }

  private getActivePuzzleFragmentCount(): number {
    return this.activeProfilePuzzle?.fragments.filter((item) => !item.decoy).length ?? 0;
  }

  private patchProgramB(): void {
    this.programB.patchState({
      phase: this.phase,
      counters: {
        day: this.currentDay,
        selectedCards: this.selectedCardIds.length,
      },
      data: {
        selectedCardIds: [...this.selectedCardIds],
        activePackageType: this.activePackage?.packageType ?? null,
        selectedEmotion: this.selectedEmotion,
        message: this.message,
      },
    });
  }
}
