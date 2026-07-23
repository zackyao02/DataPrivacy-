import type { SceneId } from "../core/types";
import type {
  CreatePackageCommand,
  AdvanceDailyPhaseCommand,
  DailyChallengeResponse,
  GameCommand,
  GameEventListener,
  PlaceCardToSlotCommand,
  RemoveCardFromSlotCommand,
  SelectBuyerCommand,
  SelectPackageCommand,
  SubmitCardToOperationPadCommand,
  SubmitTransactionCommand,
  SelectEmotionCommand,
} from "../game/GamePorts";
import {
  ProgramBBridge,
  type ProgramBEvent,
  type ProgramBEventListener,
  type ProgramBGameState,
  type ProgramBStateListener,
  type ProgramBStatePatch,
} from "../game/ProgramBBridge";
import type {
  VisibleDailyPhase,
  VisibleGameState,
  VisibleRiskStatus,
} from "../game/VisibleGameState";
import { freezeVisibleGameState, MOCK_VISIBLE_STATE } from "../game/VisibleGameState";
import {
  PROGRAM_A_WORKBENCH_SLOT_COUNT,
  type ProgramBAdapterPort,
} from "./BAdapter";
import {
  createMockBuyersForDay,
  createMockDailyFlow,
  createMockRawCardsForDay,
} from "./MockDailyFlow";

export class MockBAdapter
  implements ProgramBAdapterPort
{
  private readonly bridge: ProgramBBridge;

  constructor(initialScene: SceneId) {
    this.bridge = new ProgramBBridge(
      initialScene,
      freezeVisibleGameState({
        ...MOCK_VISIBLE_STATE,
        dailyFlow: createMockDailyFlow(MOCK_VISIBLE_STATE.day),
      }),
    );
  }

  getVisibleState(): Readonly<VisibleGameState> {
    return this.bridge.getVisibleState();
  }

  onVisibleStateChange(
    listener: (state: Readonly<VisibleGameState>) => void,
  ): () => void {
    return this.bridge.onStateChange((state) => listener(state.visibleState));
  }

  onGameEvent(listener: GameEventListener): () => void {
    return this.bridge.onEvent(listener);
  }

  submitCardToOperationPad(cardId: string): void {
    const command: SubmitCardToOperationPadCommand = {
      type: "submitCardToOperationPad",
      cardId,
    };
    this.logCommand(command, "submitCardToOperationPad(cardId)");
    this.patchVisibleState({ operationPadCardId: cardId });
    this.bridge.emit("cardSubmittedToOperationPad", {
      cardId,
      message: "Mock Program B：数据文件已递交到操作托盘。",
    });
  }

  placeCardToSlot(cardId: string, slotIndex: number): void {
    if (!this.isVisibleSlot(slotIndex)) {
      return;
    }

    const command: PlaceCardToSlotCommand = {
      type: "placeCardToSlot",
      cardId,
      slotIndex,
    };
    this.logCommand(command, "placeCardToSlot(cardId, slotIndex)");
    const slotCardIds = this.getThreeSlots().map((existingCardId) =>
      existingCardId === cardId ? null : existingCardId,
    );
    slotCardIds[slotIndex] = cardId;
    this.patchVisibleState({ workbench: { slotCardIds } });
    this.bridge.emit("cardMovedToSlot", { cardId, slotIndex });
  }

  removeCardFromSlot(slotIndex: number): void {
    if (!this.isVisibleSlot(slotIndex)) {
      return;
    }

    const command: RemoveCardFromSlotCommand = {
      type: "removeCardFromSlot",
      slotIndex,
    };
    this.logCommand(command, "removeCardFromSlot(slotIndex)");
    const slotCardIds = this.getThreeSlots();
    slotCardIds[slotIndex] = null;
    this.patchVisibleState({ workbench: { slotCardIds } });
  }

  createPackage(preferredRecipeId?: string): void {
    const command: CreatePackageCommand = {
      type: "createPackage",
      ...(preferredRecipeId ? { preferredRecipeId } : {}),
    };
    this.logCommand(command, "createPackage(preferredRecipeId?)");

    const slotCardIds = this.getThreeSlots();
    const visibleState = this.bridge.getVisibleState();
    const requiredCardCount = visibleState.day === 7 ? 1 : 3;
    const occupiedCardIds = slotCardIds.filter(
      (cardId): cardId is string => cardId !== null,
    );
    if (
      occupiedCardIds.length !== requiredCardCount ||
      new Set(occupiedCardIds).size !== occupiedCardIds.length
    ) {
      this.bridge.emit("packageWasted", {
        message: `Mock Program B：Day ${visibleState.day} 封装需要正好 ${requiredCardCount} 张不重复的数据卡。`,
      });
      return;
    }

    const outcome =
      this.bridge.getState().data.mockPackageOutcome === "packageWasted"
        ? "wasteCreated"
        : "packageCreated";
    const packageId = `MOCK-PKG-${Math.floor(performance.now())}`;
    const hasVisiblePackageCapacity =
      visibleState.processedPackages.length < 6;

    if (outcome === "packageCreated" && hasVisiblePackageCapacity) {
      this.patchVisibleState({
        processedPackages: [
          ...visibleState.processedPackages,
          {
            id: packageId,
            label: preferredRecipeId
              ? `Mock 封装 · ${preferredRecipeId}`
              : "Mock 封装数据包",
          },
        ],
        workbench: { slotCardIds: [null, null, null] },
        dailyFlow:
          visibleState.dailyFlow.phase === "processing"
            ? { ...visibleState.dailyFlow, phase: "trading" }
            : visibleState.dailyFlow,
      });
    }

    if (outcome === "packageCreated") {
      this.bridge.emit("packageCreated", {
        packageId,
        message: hasVisiblePackageCapacity
          ? "Mock Program B：数据包已生成。"
          : "Mock Program B：数据包已生成，可见区仅展示前 4 个。",
      });
      this.bridge.emit("packageSealed", { packageId });
      return;
    }

    this.bridge.emit("wasteCreated", {
      message: "Mock Program B：本次封装未生成有效数据包。",
    });
  }

  selectPackage(packageId: string): void {
    const command: SelectPackageCommand = {
      type: "selectPackage",
      packageId,
    };
    this.logCommand(command, "selectPackage(packageId)");
    this.patchVisibleState({ selectedPackageId: packageId });
  }

  selectBuyer(buyerId: string): void {
    const command: SelectBuyerCommand = {
      type: "selectBuyer",
      buyerId,
    };
    this.logCommand(command, "selectBuyer(buyerId)");
    this.patchVisibleState({ selectedBuyerId: buyerId });
  }

  submitTransaction(packageId: string, buyerId: string): void {
    const command: SubmitTransactionCommand = {
      type: "submitTransaction",
      packageId,
      buyerId,
    };
    this.logCommand(command, "submitTransaction(packageId, buyerId)");

    const gameState = this.bridge.getState();
    const succeeded =
      gameState.data.mockTransactionOutcome !== "transactionFailed";
    const summary = succeeded
      ? "Mock Program B：交易请求已成功处理。"
      : "Mock Program B：交易请求被拒绝。";
    const requestedRiskStatus = gameState.data.mockRiskStatus;
    const nextRiskStatus = this.isRiskStatus(requestedRiskStatus)
      ? requestedRiskStatus
      : gameState.visibleState.riskStatus;
    const previousRiskStatus = gameState.visibleState.riskStatus;
    const mockRiskLog = {
      id: `MOCK-RISK-${Math.round(performance.now())}`,
      status: nextRiskStatus,
      message: succeeded
        ? `Mock Program B：交易 ${packageId} → ${buyerId} 已完成。`
        : `Mock Program B：交易 ${packageId} → ${buyerId} 未通过。`,
    } as const;

    this.patchVisibleState({
      lastTransactionResult: {
        packageId,
        buyerId,
        status: succeeded ? "success" : "failed",
        summary,
      },
      riskStatus: nextRiskStatus,
      riskLogs: [mockRiskLog, ...gameState.visibleState.riskLogs].slice(0, 4),
      ...(succeeded
        ? {
            processedPackages:
              gameState.visibleState.processedPackages.filter(
                (item) => item.id !== packageId,
              ),
            selectedPackageId: null,
            selectedBuyerId: null,
            dailyFlow: {
              ...gameState.visibleState.dailyFlow,
              phase: "monologue",
            },
          }
        : {}),
    });

    if (succeeded) {
      this.bridge.emit("transactionSuccess", {
        packageId,
        buyerId,
        message: summary,
      });
      this.bridge.emit("transactionSealed", { packageId, buyerId });
    } else {
      this.bridge.emit("transactionFailed", {
        packageId,
        buyerId,
        message: summary,
      });
    }

    this.bridge.emit("riskChanged", {
      previousStatus: previousRiskStatus,
      riskStatus: nextRiskStatus,
      message: `Mock Program B：风险状态更新为 ${nextRiskStatus}。`,
    });
  }

  submitDailyChallengeChoice(challengeId: string, choiceId: string): void {
    const challenge = this.bridge.getVisibleState().dailyFlow.challenge;
    if (!challenge) {
      return;
    }
    this.submitDailyChallenge(challengeId, {
      kind: challenge.kind,
      answers: [{
        taskId: challenge.tasks[0]?.id ?? "choice",
        optionIds: [choiceId],
      }],
    });
  }

  submitDailyChallenge(
    challengeId: string,
    response: DailyChallengeResponse,
  ): void {
    const challenge = this.bridge.getVisibleState().dailyFlow.challenge;
    if (!challenge || challenge.id !== challengeId) {
      return;
    }
    const command = {
      type: "submitDailyChallenge" as const,
      challengeId,
      response,
    };
    this.logCommand(
      command,
      "submitDailyChallenge(challengeId, response)",
    );
    this.patchVisibleState({
      dailyFlow: {
        ...this.bridge.getVisibleState().dailyFlow,
        challenge: {
          ...challenge,
          status: "success",
          feedback: "Mock Program B：选择已记录，任务结果由规则层结算。",
        },
      },
    });
    this.bridge.emit("challengeSuccess", { challengeId, response });
  }

  selectEmotion(emotion: "empathy" | "anger" | "numbness"): void {
    const command: SelectEmotionCommand = { type: "selectEmotion", emotion };
    this.logCommand(command, "selectEmotion(emotion)");
    const visibleState = this.bridge.getVisibleState();
    const clarityDelta = emotion === "empathy" ? 1 : emotion === "anger" ? 2 : -1;
    const clarityScore = Math.max(
      -6,
      Math.min(12, visibleState.clarityScore + clarityDelta),
    );
    const conscience = Math.round(((clarityScore + 6) / 18) * 100);
    this.patchVisibleState({
      clarityScore,
      conscience,
      dailyFlow: {
        ...visibleState.dailyFlow,
        phase: visibleState.day === 7 ? "challenge" : "briefing",
      },
    });
    this.bridge.emit("emotionSelected", { emotion });
    this.bridge.emit(
      emotion === "empathy"
        ? "emotionEmpathySelected"
        : emotion === "anger"
          ? "emotionAngerSelected"
          : "emotionNumbnessSelected",
      { emotion },
    );
    this.bridge.emit("clarityChanged", {
      clarityScore,
      delta: clarityDelta,
    });
    this.bridge.emit("conscienceChanged", {
      conscience,
      delta: clarityDelta,
    });
  }

  advanceDailyPhase(): void {
    const command: AdvanceDailyPhaseCommand = { type: "advanceDailyPhase" };
    this.logCommand(command, "advanceDailyPhase()");
    const visibleState = this.bridge.getVisibleState();
    const current = visibleState.dailyFlow.phase;
    if (
      current === "challenge" &&
      visibleState.dailyFlow.challenge?.status !== "success" &&
      visibleState.dailyFlow.challenge?.status !== "failed"
    ) {
      return;
    }

    if (current === "monologue") {
      if (visibleState.day >= 7) {
        this.patchVisibleState({
          dailyFlow: { ...visibleState.dailyFlow, phase: "ending" },
          ending: {
            available: true,
            report: {
              title: "七日工作报告",
              endingTitle: "Mock：流程完成",
              endingBody: "七日流程已经完成，正式结局由程序 B 计算。",
              rating: "B",
              literacyRating: "待评估",
              playerNickname: "测试员工",
              days: 7,
              totalEarnings: null,
              totalConscienceLost: null,
              totalTransactions: null,
              comment: "用于程序 A 结局页面验收。",
              advice: "接入程序 B 后显示真实报告。",
            },
          },
        });
        this.bridge.emit("endingTriggered", {
          day: visibleState.day,
          clarityScore: visibleState.clarityScore,
          conscience: visibleState.conscience,
        });
        return;
      }

      const nextDay = visibleState.day + 1;
      this.patchVisibleState({
        day: nextDay,
        dailyFlow: createMockDailyFlow(nextDay, "news"),
        rawCards: createMockRawCardsForDay(nextDay),
        buyers: createMockBuyersForDay(nextDay),
        workbench: { slotCardIds: [null, null, null] },
        operationPadCardId: null,
        selectedPackageId: null,
        selectedBuyerId: null,
      });
      this.bridge.emit("blackBoxLine", {
        day: nextDay,
        stage: "briefing",
      });
      return;
    }

    const next =
      current === "briefing"
        ? visibleState.day === 7
          ? "emotion"
          : "challenge"
        : current === "challenge"
          ? "processing"
          : current === "processing"
            ? "trading"
            : current === "trading"
              ? "monologue"
              : current === "news"
                ? visibleState.day === 7
                  ? "briefing"
                  : "emotion"
                : current === "emotion"
                  ? visibleState.day === 7
                    ? "challenge"
                    : "briefing"
                  : "ending";
    this.patchVisibleState({
      dailyFlow: { ...visibleState.dailyFlow, phase: next },
    });

    if (current === "news") {
      this.bridge.emit("newsBroadcast", {
        day: visibleState.day,
        title: visibleState.yesterdayNews?.title ?? null,
      });
    }
  }

  setScene(previousScene: SceneId, currentScene: SceneId): void {
    this.bridge.patchState({ previousScene, currentScene });
  }

  getDebugState(): Readonly<ProgramBGameState> {
    return this.bridge.getState();
  }

  patchDebugState(patch: ProgramBStatePatch): Readonly<ProgramBGameState> {
    return this.bridge.patchState(patch);
  }

  emitDebugEvent(type: string, payload?: unknown): ProgramBEvent {
    return this.bridge.emit(type, payload);
  }

  onDebugStateChange(listener: ProgramBStateListener): () => void {
    return this.bridge.onStateChange(listener);
  }

  onDebugEvent(listener: ProgramBEventListener): () => void {
    return this.bridge.onEvent(listener);
  }

  setDebugDay(
    day: number,
    phase?: VisibleDailyPhase,
  ): Readonly<ProgramBGameState> {
    const normalizedDay = Math.max(1, Math.min(7, Math.trunc(day)));
    const initialPhase = phase ?? (normalizedDay === 1 ? "briefing" : "news");
    const visibleState = this.bridge.getVisibleState();

    this.patchVisibleState({
      day: normalizedDay,
      dailyFlow: createMockDailyFlow(normalizedDay, initialPhase),
      rawCards: createMockRawCardsForDay(normalizedDay),
      buyers: createMockBuyersForDay(normalizedDay),
      workbench: { slotCardIds: [null, null, null] },
      operationPadCardId: null,
      selectedPackageId: null,
      selectedBuyerId: null,
      ending: { available: false, report: null },
      yesterdayNews: {
        title: `Day ${Math.max(1, normalizedDay - 1)} 交易后续报道`,
        summary: "Mock 新闻用于验证报纸、情绪选择和每日阶段衔接。",
        dateLabel: `DAY ${normalizedDay}`,
      },
      processedPackages:
        initialPhase === "trading" ? visibleState.processedPackages : [],
    });
    this.bridge.emit("debugDayChanged", { day: normalizedDay, phase: initialPhase });
    return this.bridge.getState();
  }

  destroy(): void {
    this.bridge.destroy();
  }

  private getThreeSlots(): (string | null)[] {
    const visibleState = this.bridge.getVisibleState();
    return Array.from(
      { length: PROGRAM_A_WORKBENCH_SLOT_COUNT },
      (_, index) => visibleState.workbench.slotCardIds[index] ?? null,
    );
  }

  private patchVisibleState(patch: Partial<VisibleGameState>): void {
    const visibleState = this.bridge.getVisibleState();
    this.bridge.patchState({
      visibleState: {
        ...visibleState,
        ...patch,
      },
    });
  }

  private logCommand(command: GameCommand, signature: string): void {
    console.info(`[Program A mock BAdapter] ${signature}`, command);
    this.bridge.emit(`command:${command.type}`, command);
  }

  private isVisibleSlot(slotIndex: number): boolean {
    return (
      Number.isInteger(slotIndex) &&
      slotIndex >= 0 &&
      slotIndex < PROGRAM_A_WORKBENCH_SLOT_COUNT
    );
  }

  private isRiskStatus(value: unknown): value is VisibleRiskStatus {
    return value === "normal" || value === "warning" || value === "critical";
  }
}
