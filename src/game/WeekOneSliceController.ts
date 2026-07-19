import type {
  BlackBoxLine,
  BuyerNegotiationScript,
  CardTemplate,
  ContentRepository,
  DailyMonologue,
  DayChallenge,
  NewsTemplate,
  PackagePreview,
  ProfilePuzzle,
  UserProfile,
} from "../../program-c/src/content";
import { ProgramBBridge } from "./ProgramBBridge";

export type EmotionChoice = "empathy" | "anger" | "numbness";
export type WeekOneSlicePhase = "workbench" | "news" | "challenge";

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
  private message = "选择 3 张数据卡，封装第一个可用数据包。";

  constructor(
    private readonly content: ContentRepository,
    private readonly programB: ProgramBBridge,
  ) {
    this.user = content.getUsers()[0];
    this.selectedCardIds = content
      .getCardTemplates()
      .slice(0, MAX_SLOT_COUNT)
      .map((card) => card.id);
    this.patchProgramB();
  }

  getSnapshot(): WeekOneSliceSnapshot {
    const packagePreviews = this.content.findPackagePreviews(this.selectedCardIds);

    return {
      phase: this.phase,
      day: this.currentDay,
      user: this.user,
      availableCards: this.content.getCardTemplates().slice(0, 6),
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
    this.activeProfilePuzzle = this.content.pickProfilePuzzleByDay(4) ?? null;
    this.activeNegotiation =
      this.content.pickBuyerNegotiationScript(readyPackage.packageType) ?? null;
    this.activeMonologue = this.content.findDailyMonologueByDay(this.currentDay) ?? null;
    this.activeBlackBoxLine = this.content.pickBlackBoxLine("package_review", {
      packageType: readyPackage.packageType,
    }) ?? null;
    this.selectedEmotion = null;
    this.emotionResponse = null;
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
    this.activeBlackBoxLine =
      this.content.pickBlackBoxLine("challenge_intro", { day: this.currentDay }) ??
      this.activeBlackBoxLine;
    this.programB.emit("challengeBgm", { day: this.currentDay });
    this.programB.emit("blackBoxLine", { day: this.currentDay, stage: "challenge_intro" });
    this.patchProgramB();
    return true;
  }

  completeChallenge(succeeded: boolean): void {
    this.activeBlackBoxLine =
      this.content.pickBlackBoxLine(
        succeeded ? "challenge_success" : "challenge_fail",
        { day: this.currentDay },
      ) ?? this.activeBlackBoxLine;
    this.programB.emit(succeeded ? "challengeSuccess" : "challengeFail", {
      day: this.currentDay,
    });
    this.programB.emit("blackBoxLine", {
      day: this.currentDay,
      succeeded,
    });
    this.programB.emit("bgmSilence", { reason: "challenge-complete" });
    this.dayIndex = Math.min(this.dayIndex + 1, WEEK_ONE_DAYS.length - 1);
    this.phase = "workbench";
    this.message = succeeded
      ? `Day ${this.currentDay} 已解锁，返回工作台继续封装。`
      : `Day ${this.currentDay} 保持可重试，返回工作台调整数据包。`;
    this.patchProgramB();
  }

  private get currentDay(): number {
    return WEEK_ONE_DAYS[this.dayIndex];
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
