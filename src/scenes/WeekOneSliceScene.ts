import {
  SCENE_LABELS,
  type NormalizedPointerEvent,
  type Point,
  type RenderLayer,
  type SceneId,
} from "../core/types";
import {
  type EmotionChoice,
  WeekOneSliceController,
  type WeekOneSliceSnapshot,
} from "../game/WeekOneSliceController";
import type {
  CardTemplate,
  PublicOpinionTactic,
  RiskLevel,
} from "../../program-c/src/content";
import type { Scene, SceneFrame } from "./Scene";

type WeekOneSceneId = Extract<SceneId, "workbench" | "news" | "mini-game">;
type HitAction =
  | { readonly type: "toggle-card"; readonly cardId: string }
  | { readonly type: "seal-package" }
  | { readonly type: "choose-emotion"; readonly choice: EmotionChoice }
  | { readonly type: "begin-challenge" }
  | { readonly type: "accept-protocol-term"; readonly termId: string }
  | { readonly type: "clean-data-item"; readonly itemId: string }
  | { readonly type: "select-puzzle-fragment"; readonly fragmentId: string }
  | { readonly type: "choose-negotiation-option"; readonly optionId: string }
  | { readonly type: "choose-public-opinion-tactic"; readonly tacticId: string }
  | { readonly type: "mark-protocol-scan-clause"; readonly clauseId: string }
  | { readonly type: "match-protocol-scan-flow"; readonly flowId: string }
  | { readonly type: "find-protocol-scan-hidden-clause" }
  | { readonly type: "answer-protocol-scan-risk"; readonly level: RiskLevel }
  | { readonly type: "collect-evidence-fragment"; readonly fragmentId: string }
  | { readonly type: "collect-evidence-day"; readonly day: number }
  | { readonly type: "connect-evidence-chain"; readonly connectionId: string }
  | { readonly type: "submit-evidence-chain" }
  | { readonly type: "complete-challenge"; readonly succeeded: boolean };

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface HitZone {
  readonly rect: Rect;
  readonly action: HitAction;
}

interface Layout {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
  readonly header: Rect;
  readonly body: Rect;
  readonly footer: Rect;
}

interface WorkbenchDragState {
  readonly pointerId: number;
  readonly cardId: string;
  readonly sourceSlotIndex: number | null;
  readonly grabOffset: Point;
  readonly cardRect: Rect;
  position: Point;
  overSlotIndex: number | null;
}

const WORKBENCH_SLOT_COUNT = 3;

export class WeekOneSliceScene implements Scene {
  readonly title: string;

  private lastHandledInputTimestamp = 0;
  private workbenchDrag: WorkbenchDragState | null = null;

  constructor(
    readonly id: WeekOneSceneId,
    private readonly controller: WeekOneSliceController,
    private readonly navigate: (sceneId: SceneId) => void,
  ) {
    this.title = SCENE_LABELS[id];
  }

  enter(_frame: SceneFrame): void {}

  exit(_frame: SceneFrame): void {
    this.workbenchDrag = null;
  }

  update(frame: SceneFrame): void {
    const input = frame.input.lastEvent;

    if (this.id === "workbench" && input && this.handleWorkbenchDragInput(frame, input)) {
      return;
    }

    if (
      !input ||
      input.phase !== "click" ||
      input.timestamp === this.lastHandledInputTimestamp
    ) {
      return;
    }

    const hitZone = this.getHitZones(frame).find((zone) =>
      this.contains(zone.rect, input.position),
    );

    if (!hitZone) {
      return;
    }

    this.lastHandledInputTimestamp = input.timestamp;
    this.handleAction(hitZone.action);
  }

  renderLayer(
    context: CanvasRenderingContext2D,
    layer: RenderLayer,
    frame: SceneFrame,
  ): void {
    const layout = this.createLayout(frame);
    const snapshot = this.controller.getSnapshot();

    switch (layer) {
      case "background":
        this.renderBackground(context, layout);
        break;
      case "devices":
        this.renderShell(context, layout, snapshot);
        break;
      case "cards":
        this.renderSceneContent(context, layout, snapshot);
        break;
      case "ui":
        this.renderHeaderFooter(context, layout, snapshot);
        break;
      case "effects":
        if (this.id === "workbench") {
          this.renderWorkbenchDragPreview(context, snapshot);
        }

        this.renderPointer(context, frame.input.lastEvent?.position ?? null);
        break;
    }
  }

  private handleAction(action: HitAction): void {
    switch (action.type) {
      case "toggle-card":
        this.controller.toggleCard(action.cardId);
        break;
      case "seal-package":
        if (this.controller.sealPackage()) {
          this.navigate("news");
        }
        break;
      case "choose-emotion":
        this.controller.chooseEmotion(action.choice);
        break;
      case "begin-challenge":
        if (this.controller.beginChallenge()) {
          this.navigate("mini-game");
        }
        break;
      case "accept-protocol-term":
        if (this.controller.acceptProtocolTerm(action.termId)) {
          this.navigate("workbench");
        }
        break;
      case "clean-data-item":
        if (this.controller.cleanDataItem(action.itemId)) {
          this.navigate("workbench");
        }
        break;
      case "select-puzzle-fragment":
        if (this.controller.selectPuzzleFragment(action.fragmentId)) {
          this.navigate("workbench");
        }
        break;
      case "choose-negotiation-option":
        if (this.controller.chooseNegotiationOption(action.optionId)) {
          this.navigate("workbench");
        }
        break;
      case "choose-public-opinion-tactic":
        if (this.controller.choosePublicOpinionTactic(action.tacticId)) {
          this.navigate("workbench");
        }
        break;
      case "mark-protocol-scan-clause":
        if (this.controller.markProtocolScanClause(action.clauseId)) {
          this.navigate("workbench");
        }
        break;
      case "match-protocol-scan-flow":
        if (this.controller.matchProtocolScanFlow(action.flowId)) {
          this.navigate("workbench");
        }
        break;
      case "find-protocol-scan-hidden-clause":
        if (this.controller.findProtocolScanHiddenClause()) {
          this.navigate("workbench");
        }
        break;
      case "answer-protocol-scan-risk":
        if (this.controller.answerProtocolScanRisk(action.level)) {
          this.navigate("workbench");
        }
        break;
      case "collect-evidence-fragment":
        if (this.controller.collectEvidenceFragment(action.fragmentId)) {
          this.navigate("workbench");
        }
        break;
      case "collect-evidence-day":
        if (this.controller.collectEvidenceDay(action.day)) {
          this.navigate("workbench");
        }
        break;
      case "connect-evidence-chain":
        if (this.controller.connectEvidenceChain(action.connectionId)) {
          this.navigate("workbench");
        }
        break;
      case "submit-evidence-chain":
        if (this.controller.submitEvidenceChain()) {
          this.navigate("ending");
        }
        break;
      case "complete-challenge":
        this.controller.completeChallenge(action.succeeded);
        this.navigate("workbench");
        break;
    }
  }

  private handleWorkbenchDragInput(
    frame: SceneFrame,
    input: NormalizedPointerEvent,
  ): boolean {
    switch (input.phase) {
      case "drag-start":
        return this.startWorkbenchDrag(frame, input);
      case "drag-move":
        return this.updateWorkbenchDrag(frame, input);
      case "pointer-up":
        return this.workbenchDrag?.pointerId === input.pointerId;
      case "pointer-cancel":
        if (this.workbenchDrag?.pointerId === input.pointerId) {
          this.workbenchDrag = null;
          return true;
        }

        return false;
      case "drag-end":
        return this.finishWorkbenchDrag(frame, input);
      default:
        return false;
    }
  }

  private startWorkbenchDrag(
    frame: SceneFrame,
    input: NormalizedPointerEvent,
  ): boolean {
    const layout = this.createLayout(frame);
    const snapshot = this.controller.getSnapshot();
    const startPoint = {
      x: input.position.x - input.totalDelta.x,
      y: input.position.y - input.totalDelta.y,
    };
    const slotRects = this.getWorkbenchSlotRects(layout);
    const sourceSlotIndex = slotRects.findIndex((rect) =>
      this.contains(rect, startPoint),
    );

    if (sourceSlotIndex >= 0) {
      const cardId = snapshot.selectedCardIds[sourceSlotIndex];

      if (!cardId) {
        return false;
      }

      const cardRect = slotRects[sourceSlotIndex];
      this.workbenchDrag = {
        pointerId: input.pointerId,
        cardId,
        sourceSlotIndex,
        grabOffset: {
          x: startPoint.x - cardRect.x,
          y: startPoint.y - cardRect.y,
        },
        cardRect,
        position: input.position,
        overSlotIndex: this.findWorkbenchSlotIndex(layout, input.position),
      };
      return true;
    }

    const cardRects = this.getCardRects(layout);
    const cardIndex = cardRects.findIndex((rect) => this.contains(rect, startPoint));
    const card = snapshot.availableCards[cardIndex];

    if (!card) {
      return false;
    }

    const cardRect = cardRects[cardIndex];
    this.workbenchDrag = {
      pointerId: input.pointerId,
      cardId: card.id,
      sourceSlotIndex: null,
      grabOffset: {
        x: startPoint.x - cardRect.x,
        y: startPoint.y - cardRect.y,
      },
      cardRect,
      position: input.position,
      overSlotIndex: this.findWorkbenchSlotIndex(layout, input.position),
    };
    return true;
  }

  private updateWorkbenchDrag(
    frame: SceneFrame,
    input: NormalizedPointerEvent,
  ): boolean {
    if (!this.workbenchDrag || this.workbenchDrag.pointerId !== input.pointerId) {
      return false;
    }

    const layout = this.createLayout(frame);
    this.workbenchDrag.position = input.position;
    this.workbenchDrag.overSlotIndex = this.findWorkbenchSlotIndex(layout, input.position);
    return true;
  }

  private finishWorkbenchDrag(
    frame: SceneFrame,
    input: NormalizedPointerEvent,
  ): boolean {
    if (!this.workbenchDrag || this.workbenchDrag.pointerId !== input.pointerId) {
      return false;
    }

    const drag = this.workbenchDrag;
    const layout = this.createLayout(frame);
    const targetSlotIndex = this.findWorkbenchSlotIndex(layout, input.position);
    this.workbenchDrag = null;

    if (targetSlotIndex !== null) {
      this.controller.placeCardInSlot(drag.cardId, targetSlotIndex);
      return true;
    }

    if (drag.sourceSlotIndex !== null) {
      this.controller.removeCardFromSlot(drag.sourceSlotIndex);
      return true;
    }

    return true;
  }

  private renderSceneContent(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    if (this.id === "workbench") {
      this.renderWorkbench(context, layout, snapshot);
      return;
    }

    if (this.id === "news") {
      this.renderNews(context, layout, snapshot);
      return;
    }

    this.renderMiniGame(context, layout, snapshot);
  }

  private renderWorkbench(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const cardRects = this.getCardRects(layout);
    const panel = this.getSidePanelRect(layout);
    const selectedIds = new Set(snapshot.selectedCardIds);

    this.drawSectionTitle(context, "数据卡池", layout.body.x, layout.body.y);

    snapshot.availableCards.forEach((card, index) => {
      const rect = cardRects[index];
      const selected = selectedIds.has(card.id);
      const title = this.controller.fillText(card.title);
      const summary = this.controller.fillText(card.summary);

      this.drawPanel(context, rect, selected ? "#263d34" : "#141d22", selected ? "#77b8ad" : "#33424a");
      context.fillStyle = selected ? "#9fd6ca" : "#d7e2dc";
      context.font = "700 11px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, title, rect.x + 9, rect.y + 10, rect.width - 18, 2, 13);
      context.fillStyle = "#aebbb7";
      context.font = "500 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, summary, rect.x + 9, rect.y + 39, rect.width - 18, 1, 12);
      context.fillStyle = card.sensitivity === "high" ? "#e0a166" : "#87b6ac";
      context.font = "600 9px ui-monospace, Consolas, monospace";
      context.fillText(`${card.dataType} · ${card.sensitivity}`, rect.x + 9, rect.y + rect.height - 18);
    });

    this.drawPanel(context, panel, "#11191e", "#40505a");
    this.drawSectionTitle(context, "工作台槽位", panel.x + 12, panel.y + 14);

    const slotRects = this.getWorkbenchSlotRects(layout);
    for (let index = 0; index < WORKBENCH_SLOT_COUNT; index += 1) {
      const slotRect = slotRects[index];
      const card = snapshot.selectedCards[index];
      const isDropTarget = this.workbenchDrag?.overSlotIndex === index;
      const isDragSource = this.workbenchDrag?.sourceSlotIndex === index;

      this.drawPanel(
        context,
        slotRect,
        isDropTarget ? "#203c35" : "#0c1216",
        isDropTarget ? "#9fd6ca" : isDragSource ? "#7a5244" : "#2b3a42",
      );
      context.fillStyle = card ? (isDragSource ? "#8d9b98" : "#d7e2dc") : "#5c6b70";
      context.font = "600 10px ui-monospace, Consolas, monospace";
      context.fillText(card ? this.controller.fillText(card.title) : `空槽位 ${index + 1}`, slotRect.x + 8, slotRect.y + 18);
    }

    const ready = snapshot.readyPackages[0];
    context.fillStyle = "#91c8bd";
    context.font = "700 11px ui-monospace, Consolas, monospace";
    context.fillText("可生成数据包", panel.x + 12, panel.y + 172);
    context.fillStyle = ready ? "#d7e2dc" : "#e0a166";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      ready ? `${ready.packageType} · ${ready.buyers.length} 个买家` : "当前组合未匹配配方",
      panel.x + 12,
      panel.y + 190,
      panel.width - 24,
      2,
      14,
    );

    if (snapshot.endingPrototype.awarenessValue > 0) {
      context.fillStyle = "#91c8bd";
      context.font = "700 10px ui-monospace, Consolas, monospace";
      context.fillText("结局原型", panel.x + 12, panel.y + 226);
      context.fillStyle = "#aebbb7";
      context.font = "600 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        `清醒值 ${snapshot.endingPrototype.awarenessValue}/${snapshot.endingPrototype.threshold} · ${snapshot.endingPrototype.unlockedPathLabel} · 评级 ${snapshot.endingPrototype.reportGrade}`,
        panel.x + 12,
        panel.y + 242,
        panel.width - 24,
        2,
        12,
      );
    }

    this.drawButton(context, this.getSealButtonRect(layout), ready ? "封装数据包" : "生成废包提示", Boolean(ready));
  }

  private renderWorkbenchDragPreview(
    context: CanvasRenderingContext2D,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    if (!this.workbenchDrag) {
      return;
    }

    const drag = this.workbenchDrag;
    const card = this.findWorkbenchCard(snapshot, drag.cardId);

    if (!card) {
      return;
    }

    const rect = {
      x: drag.position.x - drag.grabOffset.x,
      y: drag.position.y - drag.grabOffset.y,
      width: drag.cardRect.width,
      height: drag.cardRect.height,
    };
    const title = this.controller.fillText(card.title);
    const summary = this.controller.fillText(card.summary);

    context.save();
    context.globalAlpha = 0.92;
    context.shadowColor = "rgba(0, 0, 0, 0.45)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 10;
    this.drawPanel(context, rect, "#203c35", drag.overSlotIndex !== null ? "#9fd6ca" : "#e0a166");
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.fillStyle = "#e7eee9";
    context.font = "800 11px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, title, rect.x + 9, rect.y + 12, rect.width - 18, 2, 13);
    context.fillStyle = "#aebbb7";
    context.font = "600 9px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, summary, rect.x + 9, rect.y + 42, rect.width - 18, 1, 12);
    context.fillStyle = drag.overSlotIndex !== null ? "#9fd6ca" : "#e0a166";
    context.font = "700 9px ui-monospace, Consolas, monospace";
    const dragHint =
      drag.overSlotIndex !== null
        ? `放入槽位 ${drag.overSlotIndex + 1}`
        : drag.sourceSlotIndex !== null
          ? "拖出槽位移除"
          : "拖到槽位放入";
    context.fillText(
      dragHint,
      rect.x + 9,
      rect.y + rect.height - 14,
    );
    context.restore();
  }

  private findWorkbenchCard(
    snapshot: WeekOneSliceSnapshot,
    cardId: string,
  ): CardTemplate | undefined {
    return (
      snapshot.availableCards.find((card) => card.id === cardId) ??
      snapshot.selectedCards.find((card) => card.id === cardId)
    );
  }

  private renderNews(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const article = {
      x: layout.body.x,
      y: layout.body.y + 8,
      width: layout.body.width,
      height: Math.min(245, layout.body.height * 0.48),
    };
    const news = snapshot.activeNews;

    this.drawPanel(context, article, "#12191d", "#435159");
    this.drawSectionTitle(context, `Day ${snapshot.day} 新闻反馈`, article.x + 14, article.y + 18);
    context.fillStyle = "#d7e2dc";
    context.font = "700 16px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      news ? this.controller.fillText(news.headline) : "等待数据包封装",
      article.x + 14,
      article.y + 52,
      article.width - 28,
      2,
      19,
    );
    context.fillStyle = "#aebbb7";
    context.font = "500 11px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      news ? this.controller.fillText(news.body) : "回到工作台，先封装一个有效数据包。",
      article.x + 14,
      article.y + 102,
      article.width - 28,
      5,
      16,
    );

    const emotionRects = this.getEmotionRects(layout);
    const emotionLabels: Record<EmotionChoice, string> = {
      empathy: "同情",
      anger: "愤怒",
      numbness: "麻木",
    };

    (Object.keys(emotionLabels) as EmotionChoice[]).forEach((choice, index) => {
      this.drawButton(
        context,
        emotionRects[index],
        emotionLabels[choice],
        snapshot.selectedEmotion === choice,
      );
    });

    if (snapshot.emotionResponse) {
      context.fillStyle = "#d7e2dc";
      context.font = "600 11px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        snapshot.emotionResponse,
        layout.body.x + 12,
        emotionRects[0].y + emotionRects[0].height + 22,
        layout.body.width - 24,
        4,
        16,
      );
    }

    if (snapshot.activeMonologue) {
      context.fillStyle = "#91c8bd";
      context.font = "700 10px ui-monospace, Consolas, monospace";
      context.fillText(snapshot.activeMonologue.title, layout.body.x + 12, layout.footer.y - 60);
      context.fillStyle = "#aebbb7";
      context.font = "500 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        snapshot.activeMonologue.textSegments[0],
        layout.body.x + 12,
        layout.footer.y - 43,
        layout.body.width - 24,
        2,
        14,
      );
    }

    this.drawButton(context, this.getChallengeButtonRect(layout), "进入小关卡", Boolean(snapshot.selectedEmotion));
  }

  private renderMiniGame(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    this.renderMiniGameInteractive(context, layout, snapshot);
  }

  private renderMiniGameInteractive(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const panel = this.getMiniGamePanelRect(layout);
    const challenge = snapshot.activeChallenge;

    this.drawPanel(context, panel, "#101a18", "#3e6158");
    this.drawSectionTitle(context, `Day ${snapshot.day} 小关卡`, panel.x + 14, panel.y + 18);
    context.fillStyle = "#d7e2dc";
    context.font = "700 16px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      challenge?.title ?? "等待新闻反馈",
      panel.x + 14,
      panel.y + 52,
      panel.width - 28,
      2,
      19,
    );
    context.fillStyle = "#aebbb7";
    context.font = "500 11px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      challenge?.briefing ?? "先完成工作台封装和新闻情绪选择。",
      panel.x + 14,
      panel.y + 102,
      panel.width - 28,
      4,
      16,
    );

    if (!challenge) {
      return;
    }

    context.fillStyle = "#91c8bd";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.fillText(snapshot.miniGame.progressText, panel.x + 14, panel.y + 176);

    switch (challenge.type) {
      case "protocol_match":
        this.renderProtocolMatch(context, layout, snapshot);
        break;
      case "data_cleaning":
        this.renderDataCleaning(context, layout, snapshot);
        break;
      case "public_opinion":
        this.renderPublicOpinion(context, layout, snapshot);
        break;
      case "profile_puzzle":
        this.renderProfilePuzzle(context, layout, snapshot);
        break;
      case "buyer_negotiation":
        this.renderBuyerNegotiation(context, layout, snapshot);
        break;
      case "protocol_scan":
        this.renderProtocolScan(context, layout, snapshot);
        break;
      case "evidence_chain":
        this.renderEvidenceChain(context, layout, snapshot);
        break;
    }

    const blackBoxY = panel.y + panel.height - 62;
    if (
      snapshot.activeBlackBoxLine &&
      this.getMiniGameContentBottom(layout, snapshot) + 10 <= blackBoxY
    ) {
      this.drawMiniBlock(
        context,
        "黑盒反馈",
        snapshot.activeBlackBoxLine.text,
        panel.x + 14,
        blackBoxY,
        panel.width - 28,
      );
    }
  }

  private renderProtocolMatch(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const accepted = new Set(snapshot.miniGame.acceptedProtocolTermIds);
    const rects = this.getProtocolTermRects(layout, snapshot.miniGame.protocolTerms.length);

    snapshot.miniGame.protocolTerms.forEach((term, index) => {
      const rect = rects[index];
      const active = accepted.has(term.id);

      this.drawPanel(context, rect, active ? "#263d34" : "#111c20", active ? "#77b8ad" : "#40505a");
      context.fillStyle = active ? "#9fd6ca" : "#e2ebe6";
      context.font = "800 10px ui-monospace, Consolas, monospace";
      context.fillText(active ? "已伪装" : `协议 ${index + 1}`, rect.x + 9, rect.y + 16);
      context.fillStyle = "#d7e2dc";
      context.font = "700 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, `${term.riskyTerm} => ${term.disguisedTerm}`, rect.x + 9, rect.y + 33, rect.width - 18, 2, 13);
      context.fillStyle = "#91a09b";
      context.font = "500 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, term.explanation, rect.x + 9, rect.y + 60, rect.width - 18, 2, 12);
    });
  }

  private renderDataCleaning(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const cleaned = new Set(snapshot.miniGame.cleanedSensitiveItemIds);
    const rects = this.getCleaningItemRects(layout, snapshot.miniGame.cleaningItems.length);

    snapshot.miniGame.cleaningItems.forEach((item, index) => {
      const rect = rects[index];
      const active = cleaned.has(item.id);
      const decoy = item.kind === "decoy";

      this.drawPanel(
        context,
        rect,
        active ? "#263d34" : decoy ? "#251b18" : "#111c20",
        active ? "#77b8ad" : decoy ? "#7a5244" : "#40505a",
      );
      context.fillStyle = decoy ? "#e0a166" : active ? "#9fd6ca" : "#d7e2dc";
      context.font = "800 10px ui-monospace, Consolas, monospace";
      context.fillText(active ? "已清理" : decoy ? "干扰项" : "敏感项", rect.x + 8, rect.y + 15);
      context.fillStyle = "#e2ebe6";
      context.font = "700 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, item.label, rect.x + 8, rect.y + 32, rect.width - 16, 1, 13);
      context.fillStyle = "#91a09b";
      context.font = "500 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, item.description, rect.x + 8, rect.y + 48, rect.width - 16, 1, 12);
    });
  }

  private renderPublicOpinion(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const panel = this.getMiniGamePanelRect(layout);
    const script = snapshot.miniGame.publicOpinionScript;

    if (!script) {
      this.drawMiniBlock(
        context,
        "舆论操控",
        "没有可用舆论脚本，请检查 Day 3 文本配置。",
        panel.x + 14,
        panel.y + 194,
        panel.width - 28,
      );
      return;
    }

    this.drawMiniBlock(
      context,
      script.platform,
      `负面新闻：${script.openingLine}`,
      panel.x + 14,
      panel.y + 194,
      panel.width - 28,
    );

    context.fillStyle = "#aebbb7";
    context.font = "500 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      script.manipulationGoal,
      panel.x + 14,
      panel.y + 238,
      panel.width - 28,
      2,
      14,
    );

    const rects = this.getPublicOpinionTacticRects(
      layout,
      snapshot.miniGame.publicOpinionTactics.length,
    );
    snapshot.miniGame.publicOpinionTactics.forEach((tactic, index) => {
      this.renderPublicOpinionTactic(context, rects[index], tactic, index, snapshot);
    });

    const promptY = this.getRectsBottom(rects) + 14;
    if (promptY + 40 <= panel.y + panel.height - 12) {
      context.fillStyle = "#e0a166";
      context.font = "700 9px ui-monospace, Consolas, monospace";
      context.fillText("评论区", panel.x + 14, promptY);
      context.fillStyle = "#aebbb7";
      context.font = "500 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        `${script.counterCue} ${script.consciencePrompt}`,
        panel.x + 14,
        promptY + 14,
        panel.width - 28,
        2,
        12,
      );
    }
  }

  private renderProfilePuzzle(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const panel = this.getMiniGamePanelRect(layout);
    const accepted = new Set(snapshot.miniGame.acceptedPuzzleFragmentIds);
    const rects = this.getPuzzleFragmentRects(layout, snapshot.miniGame.puzzleFragments.length);

    if (snapshot.activeProfilePuzzle) {
      context.fillStyle = "#aebbb7";
      context.font = "500 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        snapshot.activeProfilePuzzle.objective,
        panel.x + 14,
        panel.y + 194,
        panel.width - 28,
        2,
        14,
      );
    }

    snapshot.miniGame.puzzleFragments.forEach((fragment, index) => {
      const rect = rects[index];
      const active = accepted.has(fragment.id);

      this.drawPanel(context, rect, active ? "#263d34" : "#111c20", active ? "#77b8ad" : "#40505a");
      context.fillStyle = fragment.decoy ? "#e0a166" : active ? "#9fd6ca" : "#d7e2dc";
      context.font = "800 10px ui-monospace, Consolas, monospace";
      context.fillText(active ? "已归位" : fragment.decoy ? "干扰线索" : "画像碎片", rect.x + 8, rect.y + 15);
      context.fillStyle = "#e2ebe6";
      context.font = "700 10px ui-monospace, Consolas, monospace";
      context.fillText(fragment.label, rect.x + 8, rect.y + 32);
      context.fillStyle = "#91a09b";
      context.font = "500 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, fragment.text, rect.x + 8, rect.y + 48, rect.width - 16, 2, 12);
    });
  }

  private renderPublicOpinionTactic(
    context: CanvasRenderingContext2D,
    rect: Rect,
    tactic: PublicOpinionTactic,
    index: number,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const active = snapshot.miniGame.selectedPublicOpinionTacticId === tactic.id;
    const optionName = `方案 ${String.fromCharCode(65 + index)}`;

    this.drawPanel(
      context,
      rect,
      active ? "#263d34" : "#101c20",
      active ? "#77b8ad" : "#40505a",
    );
    context.fillStyle = "#9fd6ca";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.fillText(optionName, rect.x + 9, rect.y + 16);
    context.fillStyle = "#d7e2dc";
    context.font = "700 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, tactic.line, rect.x + 9, rect.y + 34, rect.width - 18, 2, 13);
    context.fillStyle = "#91a09b";
    context.font = "500 9px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      "点击发布改写",
      rect.x + 9,
      rect.y + rect.height - 18,
      rect.width - 18,
      1,
      12,
    );
  }

  private renderBuyerNegotiation(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const panel = this.getMiniGamePanelRect(layout);
    const rects = this.getNegotiationOptionRects(layout, snapshot.miniGame.negotiationOptions.length);

    if (snapshot.activeNegotiation) {
      this.drawMiniBlock(
        context,
        snapshot.activeNegotiation.buyerType,
        snapshot.activeNegotiation.scenario,
        panel.x + 14,
        panel.y + 194,
        panel.width - 28,
      );
    }

    snapshot.miniGame.negotiationOptions.forEach((option, index) => {
      const rect = rects[index];
      const active = snapshot.miniGame.selectedNegotiationOptionId === option.id;

      this.drawPanel(context, rect, active ? "#263d34" : "#111c20", active ? "#77b8ad" : "#40505a");
      context.fillStyle = active ? "#9fd6ca" : "#d7e2dc";
      context.font = "800 11px ui-monospace, Consolas, monospace";
      context.fillText(option.label, rect.x + 10, rect.y + 18);
      context.fillStyle = "#e0a166";
      context.font = "700 9px ui-monospace, Consolas, monospace";
      context.fillText(option.tone.toUpperCase(), rect.x + 10, rect.y + 35);
      context.fillStyle = "#aebbb7";
      context.font = "500 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, option.playerLine, rect.x + 10, rect.y + 54, rect.width - 20, 3, 14);
    });
  }

  private renderProtocolScan(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const panel = this.getMiniGamePanelRect(layout);
    const template = snapshot.miniGame.protocolScanTemplate;

    if (!template) {
      this.drawMiniBlock(
        context,
        "协议扫描",
        "没有可用协议模板，请检查 Day 6 文本配置。",
        panel.x + 14,
        panel.y + 194,
        panel.width - 28,
      );
      return;
    }

    this.drawMiniBlock(
      context,
      template.title,
      template.agreementTitle,
      panel.x + 14,
      panel.y + 194,
      panel.width - 28,
    );

    const markedClauses = new Set(snapshot.miniGame.markedProtocolScanClauseIds);
    const matchedFlows = new Set(snapshot.miniGame.matchedProtocolScanFlowIds);
    const clauseRects = this.getProtocolScanClauseRects(layout, template.riskClauses.length);
    const flowRects = this.getProtocolScanFlowRects(layout, template.dataFlowMatches.length);
    const hiddenRect = this.getProtocolScanHiddenRect(layout);
    const riskRects = this.getProtocolScanRiskAnswerRects(layout);

    template.riskClauses.forEach((clause, index) => {
      const rect = clauseRects[index];
      const active = markedClauses.has(clause.id);

      this.drawPanel(context, rect, active ? "#263d34" : "#161d22", active ? "#77b8ad" : "#5f4637");
      context.fillStyle = active ? "#9fd6ca" : "#e0a166";
      context.font = "800 9px ui-monospace, Consolas, monospace";
      context.fillText(active ? "已标记" : `高危 ${index + 1}`, rect.x + 8, rect.y + 14);
      context.fillStyle = "#e2ebe6";
      context.font = "600 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, clause.text, rect.x + 8, rect.y + 30, rect.width - 16, 2, 12);
    });

    template.dataFlowMatches.forEach((flow, index) => {
      const rect = flowRects[index];
      const active = matchedFlows.has(flow.id);

      this.drawPanel(context, rect, active ? "#263d34" : "#101c20", active ? "#77b8ad" : "#40505a");
      context.fillStyle = active ? "#9fd6ca" : "#d7e2dc";
      context.font = "800 9px ui-monospace, Consolas, monospace";
      context.fillText(active ? "已匹配" : `流向 ${index + 1}`, rect.x + 8, rect.y + 14);
      context.fillStyle = "#aebbb7";
      context.font = "600 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, `${flow.source} -> ${flow.destination}`, rect.x + 8, rect.y + 30, rect.width - 16, 1, 12);
    });

    this.drawPanel(
      context,
      hiddenRect,
      snapshot.miniGame.hiddenProtocolScanClauseFound ? "#263d34" : "#1f1816",
      snapshot.miniGame.hiddenProtocolScanClauseFound ? "#77b8ad" : "#7a5244",
    );
    context.fillStyle = snapshot.miniGame.hiddenProtocolScanClauseFound ? "#9fd6ca" : "#e0a166";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.fillText(
      snapshot.miniGame.hiddenProtocolScanClauseFound ? "隐藏条款已发现" : "隐藏条款",
      hiddenRect.x + 9,
      hiddenRect.y + 16,
    );
    context.fillStyle = "#aebbb7";
    context.font = "600 9px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      `${template.hiddenClause.disguise} -> ${template.hiddenClause.text}`,
      hiddenRect.x + 9,
      hiddenRect.y + 32,
      hiddenRect.width - 18,
      1,
      12,
    );

    const levels: readonly RiskLevel[] = ["high", "medium", "low"];
    const labels: Record<RiskLevel, string> = {
      high: "高",
      medium: "中",
      low: "低",
    };

    levels.forEach((level, index) => {
      this.drawButton(
        context,
        riskRects[index],
        `风险 ${labels[level]}`,
        snapshot.miniGame.selectedProtocolScanRiskLevel === level,
      );
    });
  }

  private renderEvidenceChain(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    const panel = this.getMiniGamePanelRect(layout);
    const template = snapshot.miniGame.evidenceChainTemplate;

    if (!template) {
      this.drawMiniBlock(
        context,
        "证据链",
        "没有可用证据链模板，请检查 Day 7 文本配置。",
        panel.x + 14,
        panel.y + 194,
        panel.width - 28,
      );
      return;
    }

    const highAwareness = snapshot.miniGame.evidencePath === "evidence_chain";
    const pathRect = {
      x: panel.x + 14,
      y: panel.y + 194,
      width: panel.width - 28,
      height: 58,
    };

    this.drawPanel(context, pathRect, highAwareness ? "#10201d" : "#211918", highAwareness ? "#4d766c" : "#7a5244");
    context.fillStyle = highAwareness ? "#9fd6ca" : "#e0a166";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.fillText(highAwareness ? template.highAwarenessPathTitle : template.lowAwarenessPathTitle, pathRect.x + 10, pathRect.y + 17);
    context.fillStyle = "#d7e2dc";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      highAwareness ? template.objective : template.lockedReason,
      pathRect.x + 10,
      pathRect.y + 35,
      pathRect.width - 20,
      2,
      12,
    );

    if (!highAwareness) {
      const finalRect = this.getEvidenceFinalPackageRect(layout);
      this.drawPanel(context, finalRect, "#161d22", "#5f4637");
      context.fillStyle = "#e0a166";
      context.font = "800 10px ui-monospace, Consolas, monospace";
      context.fillText(template.finalPackage.title, finalRect.x + 10, finalRect.y + 17);
      context.fillStyle = "#d7e2dc";
      context.font = "600 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        this.controller.fillText(template.finalPackage.description),
        finalRect.x + 10,
        finalRect.y + 36,
        finalRect.width - 20,
        2,
        13,
      );
      context.fillStyle = "#91a09b";
      context.font = "600 9px ui-monospace, Consolas, monospace";
      context.fillText(`买家：${template.finalPackage.buyerName}`, finalRect.x + 10, finalRect.y + finalRect.height - 12);
      this.drawButton(context, this.getEvidenceSubmitRect(layout, snapshot), "交付最后的数据包", true);
      return;
    }

    const collected = new Set(snapshot.miniGame.collectedEvidenceFragmentIds);
    const connected = new Set(snapshot.miniGame.connectedEvidenceConnectionIds);
    const evidenceDays = this.getEvidenceDays(snapshot);
    const dayRects = this.getEvidenceDayRects(layout, evidenceDays.length);

    evidenceDays.forEach((day, index) => {
      const rect = dayRects[index];
      const fragments = snapshot.miniGame.evidenceFragments.filter(
        (fragment) => fragment.day === day,
      );
      const collectedCount = fragments.filter((fragment) => collected.has(fragment.id)).length;
      const active = collectedCount === fragments.length;

      this.drawPanel(context, rect, active ? "#263d34" : "#101c20", active ? "#77b8ad" : "#40505a");
      context.fillStyle = active ? "#9fd6ca" : "#d7e2dc";
      context.font = "800 10px ui-monospace, Consolas, monospace";
      context.fillText(active ? `Day ${day} 已纳入` : `Day ${day} 文件夹`, rect.x + 8, rect.y + 16);
      context.fillStyle = "#e2ebe6";
      context.font = "700 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        `${collectedCount}/${fragments.length} 件证据`,
        rect.x + 8,
        rect.y + 32,
        rect.width - 16,
        1,
        11,
      );
      context.fillStyle = "#91a09b";
      context.font = "500 8px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        fragments.map((fragment) => fragment.title.replace(`Day${day}`, "")).join(" / "),
        rect.x + 8,
        rect.y + 46,
        rect.width - 16,
        1,
        10,
      );
    });

    const connectionRects = this.getEvidenceConnectionRects(
      layout,
      snapshot.miniGame.evidenceConnections.length,
      snapshot,
    );

    snapshot.miniGame.evidenceConnections.forEach((connection, index) => {
      const rect = connectionRects[index];
      const active = connected.has(connection.id);
      const endpointsReady =
        collected.has(connection.fromFragmentId) && collected.has(connection.toFragmentId);

      this.drawPanel(
        context,
        rect,
        active ? "#263d34" : endpointsReady ? "#111c20" : "#201a18",
        active ? "#77b8ad" : endpointsReady ? "#40505a" : "#7a5244",
      );
      context.fillStyle = active ? "#9fd6ca" : endpointsReady ? "#d7e2dc" : "#e0a166";
      context.font = "800 9px ui-monospace, Consolas, monospace";
      context.fillText(active ? "已连接" : `连接 ${index + 1}`, rect.x + 8, rect.y + 14);
      context.fillStyle = "#e2ebe6";
      context.font = "700 9px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, connection.label, rect.x + 8, rect.y + 30, rect.width - 16, 1, 11);
      context.fillStyle = "#91a09b";
      context.font = "500 8px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, connection.rationale, rect.x + 8, rect.y + 43, rect.width - 16, 1, 10);
    });

    const ready =
      snapshot.miniGame.collectedEvidenceFragmentIds.length >=
        snapshot.miniGame.evidenceFragments.length &&
      snapshot.miniGame.connectedEvidenceConnectionIds.length >=
        snapshot.miniGame.evidenceConnections.length;
    this.drawButton(context, this.getEvidenceSubmitRect(layout, snapshot), "提交举报材料", ready);
  }

  private renderBackground(context: CanvasRenderingContext2D, layout: Layout): void {
    context.fillStyle = "#080b0f";
    context.fillRect(0, 0, layout.width, layout.height);

    context.strokeStyle = "#152228";
    context.lineWidth = 1;
    for (let x = 0; x < layout.width; x += 28) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, layout.height);
      context.stroke();
    }
    for (let y = 0; y < layout.height; y += 28) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(layout.width, y);
      context.stroke();
    }
  }

  private renderShell(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    this.drawPanel(context, layout.body, "rgba(9, 14, 18, 0.9)", "#26353c");
    context.fillStyle = "#53656b";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    context.fillText(snapshot.phase.toUpperCase(), layout.body.x + 12, layout.body.y + layout.body.height - 13);
  }

  private renderHeaderFooter(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): void {
    context.fillStyle = "rgba(4, 7, 9, 0.9)";
    context.fillRect(layout.header.x, layout.header.y, layout.header.width, layout.header.height);
    context.fillRect(layout.footer.x, layout.footer.y, layout.footer.width, layout.footer.height);

    context.fillStyle = "#d7e2dc";
    context.font = "800 17px ui-monospace, Consolas, monospace";
    context.fillText("Program C 垂直切片", layout.margin, 26);
    context.fillStyle = "#91c8bd";
    context.font = "700 10px ui-monospace, Consolas, monospace";
    context.fillText(`${this.title} · Day ${snapshot.day} · ${snapshot.user.name}`, layout.margin, 47);

    context.fillStyle = "#aebbb7";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, snapshot.message, layout.margin, layout.footer.y + 17, layout.width - layout.margin * 2, 2, 14);
  }

  private renderPointer(context: CanvasRenderingContext2D, pointer: Point | null): void {
    if (!pointer) {
      return;
    }

    context.strokeStyle = "#dca75e";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(pointer.x, pointer.y, 7, 0, Math.PI * 2);
    context.moveTo(pointer.x - 11, pointer.y);
    context.lineTo(pointer.x + 11, pointer.y);
    context.moveTo(pointer.x, pointer.y - 11);
    context.lineTo(pointer.x, pointer.y + 11);
    context.stroke();
  }

  private getHitZones(frame: SceneFrame): readonly HitZone[] {
    const layout = this.createLayout(frame);
    const snapshot = this.controller.getSnapshot();

    if (this.id === "workbench") {
      return [
        ...snapshot.availableCards.map((card, index) => ({
          rect: this.getCardRects(layout)[index],
          action: { type: "toggle-card", cardId: card.id } as const,
        })),
        {
          rect: this.getSealButtonRect(layout),
          action: { type: "seal-package" },
        },
      ];
    }

    if (this.id === "news") {
      const choices: readonly EmotionChoice[] = ["empathy", "anger", "numbness"];

      return [
        ...choices.map((choice, index) => ({
          rect: this.getEmotionRects(layout)[index],
          action: { type: "choose-emotion", choice } as const,
        })),
        {
          rect: this.getChallengeButtonRect(layout),
          action: { type: "begin-challenge" },
        },
      ];
    }

    switch (snapshot.activeChallenge?.type) {
      case "protocol_match": {
        const rects = this.getProtocolTermRects(layout, snapshot.miniGame.protocolTerms.length);

        return snapshot.miniGame.protocolTerms.map((term, index) => ({
          rect: rects[index],
          action: { type: "accept-protocol-term", termId: term.id } as const,
        }));
      }
      case "data_cleaning": {
        const rects = this.getCleaningItemRects(layout, snapshot.miniGame.cleaningItems.length);

        return snapshot.miniGame.cleaningItems.map((item, index) => ({
          rect: rects[index],
          action: { type: "clean-data-item", itemId: item.id } as const,
        }));
      }
      case "public_opinion": {
        const rects = this.getPublicOpinionTacticRects(
          layout,
          snapshot.miniGame.publicOpinionTactics.length,
        );

        return snapshot.miniGame.publicOpinionTactics.map((tactic, index) => ({
          rect: rects[index],
          action: {
            type: "choose-public-opinion-tactic",
            tacticId: tactic.id,
          } as const,
        }));
      }
      case "profile_puzzle": {
        const rects = this.getPuzzleFragmentRects(layout, snapshot.miniGame.puzzleFragments.length);

        return snapshot.miniGame.puzzleFragments.map((fragment, index) => ({
          rect: rects[index],
          action: { type: "select-puzzle-fragment", fragmentId: fragment.id } as const,
        }));
      }
      case "buyer_negotiation": {
        const rects = this.getNegotiationOptionRects(
          layout,
          snapshot.miniGame.negotiationOptions.length,
        );

        return snapshot.miniGame.negotiationOptions.map((option, index) => ({
          rect: rects[index],
          action: { type: "choose-negotiation-option", optionId: option.id } as const,
        }));
      }
      case "protocol_scan": {
        const template = snapshot.miniGame.protocolScanTemplate;

        if (!template) {
          return [];
        }

        const levels: readonly RiskLevel[] = ["high", "medium", "low"];

        return [
          ...template.riskClauses.map((clause, index) => ({
            rect: this.getProtocolScanClauseRects(layout, template.riskClauses.length)[index],
            action: {
              type: "mark-protocol-scan-clause",
              clauseId: clause.id,
            } as const,
          })),
          ...template.dataFlowMatches.map((flow, index) => ({
            rect: this.getProtocolScanFlowRects(layout, template.dataFlowMatches.length)[index],
            action: {
              type: "match-protocol-scan-flow",
              flowId: flow.id,
            } as const,
          })),
          {
            rect: this.getProtocolScanHiddenRect(layout),
            action: { type: "find-protocol-scan-hidden-clause" } as const,
          },
          ...levels.map((level, index) => ({
            rect: this.getProtocolScanRiskAnswerRects(layout)[index],
            action: { type: "answer-protocol-scan-risk", level } as const,
          })),
        ];
      }
      case "evidence_chain": {
        const template = snapshot.miniGame.evidenceChainTemplate;

        if (!template) {
          return [];
        }

        if (snapshot.miniGame.evidencePath === "final_package") {
          return [
            {
              rect: this.getEvidenceSubmitRect(layout, snapshot),
              action: { type: "submit-evidence-chain" } as const,
            },
          ];
        }

        const evidenceDays = this.getEvidenceDays(snapshot);
        const dayRects = this.getEvidenceDayRects(layout, evidenceDays.length);
        const connectionRects = this.getEvidenceConnectionRects(
          layout,
          snapshot.miniGame.evidenceConnections.length,
          snapshot,
        );

        return [
          ...evidenceDays.map((day, index) => ({
            rect: dayRects[index],
            action: {
              type: "collect-evidence-day",
              day,
            } as const,
          })),
          ...snapshot.miniGame.evidenceConnections.map((connection, index) => ({
            rect: connectionRects[index],
            action: {
              type: "connect-evidence-chain",
              connectionId: connection.id,
            } as const,
          })),
          {
            rect: this.getEvidenceSubmitRect(layout, snapshot),
            action: { type: "submit-evidence-chain" } as const,
          },
        ];
      }
      default: {
        const [successRect, failRect] = this.getChallengeResultRects(layout);

        return [
          {
            rect: successRect,
            action: { type: "complete-challenge", succeeded: true },
          },
          {
            rect: failRect,
            action: { type: "complete-challenge", succeeded: false },
          },
        ];
      }
    }
  }

  private createLayout(frame: SceneFrame): Layout {
    const width = frame.viewport.logicalWidth;
    const height = frame.viewport.logicalHeight;
    const margin = Math.max(14, Math.min(width, height) * 0.04);
    const headerHeight = 64;
    const footerHeight = 56;

    return {
      width,
      height,
      margin,
      header: { x: 0, y: 0, width, height: headerHeight },
      body: {
        x: margin,
        y: headerHeight + margin,
        width: width - margin * 2,
        height: height - headerHeight - footerHeight - margin * 2,
      },
      footer: { x: 0, y: height - footerHeight, width, height: footerHeight },
    };
  }

  private getCardRects(layout: Layout): readonly Rect[] {
    const panel = this.getCardGridRect(layout);
    const columns = panel.width > 430 ? 3 : 2;
    const gap = 9;
    const cardWidth = (panel.width - gap * (columns - 1)) / columns;
    const cardHeight = 82;

    return Array.from({ length: 6 }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      return {
        x: panel.x + column * (cardWidth + gap),
        y: panel.y + 30 + row * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight,
      };
    });
  }

  private getCardGridRect(layout: Layout): Rect {
    const wide = layout.body.width >= 620;

    return {
      x: layout.body.x + 12,
      y: layout.body.y + 12,
      width: wide ? layout.body.width * 0.6 - 24 : layout.body.width - 24,
      height: wide ? layout.body.height - 24 : Math.min(310, layout.body.height * 0.58),
    };
  }

  private getSidePanelRect(layout: Layout): Rect {
    const wide = layout.body.width >= 620;
    const cardGrid = this.getCardGridRect(layout);

    if (wide) {
      return {
        x: cardGrid.x + cardGrid.width + 16,
        y: cardGrid.y,
        width: layout.body.x + layout.body.width - cardGrid.x - cardGrid.width - 28,
        height: cardGrid.height,
      };
    }

    return {
      x: layout.body.x + 12,
      y: cardGrid.y + cardGrid.height + 12,
      width: layout.body.width - 24,
      height: layout.body.y + layout.body.height - cardGrid.y - cardGrid.height - 24,
    };
  }

  private getWorkbenchSlotRects(layout: Layout): readonly Rect[] {
    const panel = this.getSidePanelRect(layout);
    const slotY = panel.y + 42;

    return Array.from({ length: WORKBENCH_SLOT_COUNT }, (_, index) => ({
      x: panel.x + 12,
      y: slotY + index * 38,
      width: panel.width - 24,
      height: 29,
    }));
  }

  private findWorkbenchSlotIndex(layout: Layout, point: Point): number | null {
    const slotIndex = this.getWorkbenchSlotRects(layout).findIndex((rect) =>
      this.contains(rect, point),
    );

    return slotIndex >= 0 ? slotIndex : null;
  }

  private getSealButtonRect(layout: Layout): Rect {
    const panel = this.getSidePanelRect(layout);

    return {
      x: panel.x + 12,
      y: panel.y + panel.height - 50,
      width: panel.width - 24,
      height: 36,
    };
  }

  private getEmotionRects(layout: Layout): readonly Rect[] {
    const gap = 8;
    const width = (layout.body.width - gap * 2) / 3;
    const y = layout.body.y + Math.min(285, layout.body.height * 0.55);

    return Array.from({ length: 3 }, (_, index) => ({
      x: layout.body.x + index * (width + gap),
      y,
      width,
      height: 38,
    }));
  }

  private getChallengeButtonRect(layout: Layout): Rect {
    return {
      x: layout.body.x,
      y: layout.footer.y - 48,
      width: layout.body.width,
      height: 36,
    };
  }

  private getMiniGamePanelRect(layout: Layout): Rect {
    return {
      x: layout.body.x,
      y: layout.body.y + 10,
      width: layout.body.width,
      height: layout.body.height - 20,
    };
  }

  private getProtocolTermRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 2 : 1;

    return this.getMiniGameItemRects(layout, count, 210, 74, columns);
  }

  private getCleaningItemRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 4 : panel.width >= 420 ? 3 : 2;

    return this.getMiniGameItemRects(layout, count, 190, 52, columns);
  }

  private getPublicOpinionTacticRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 3 : 1;

    return this.getMiniGameItemRects(layout, count, 266, 74, columns);
  }

  private getPuzzleFragmentRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 3 : 2;

    return this.getMiniGameItemRects(layout, count, 238, 64, columns);
  }

  private getNegotiationOptionRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 2 : 1;

    return this.getMiniGameItemRects(layout, count, 254, 104, columns);
  }

  private getProtocolScanClauseRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 360 ? 2 : 1;

    return this.getMiniGameItemRects(layout, count, 220, 54, columns);
  }

  private getProtocolScanFlowRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 3 : panel.width >= 420 ? 2 : 1;
    const startOffsetY =
      this.getRectsBottom(this.getProtocolScanClauseRects(layout, 4)) - panel.y + 8;

    return this.getMiniGameItemRects(layout, count, startOffsetY, 44, columns);
  }

  private getProtocolScanHiddenRect(layout: Layout): Rect {
    const panel = this.getMiniGamePanelRect(layout);
    const flowBottom = this.getRectsBottom(this.getProtocolScanFlowRects(layout, 3));

    return {
      x: panel.x + 14,
      y: flowBottom + 8,
      width: panel.width - 28,
      height: 44,
    };
  }

  private getProtocolScanRiskAnswerRects(layout: Layout): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const hiddenRect = this.getProtocolScanHiddenRect(layout);
    const gap = 8;
    const width = (panel.width - 28 - gap * 2) / 3;

    return Array.from({ length: 3 }, (_, index) => ({
      x: panel.x + 14 + index * (width + gap),
      y: hiddenRect.y + hiddenRect.height + 8,
      width,
      height: 34,
    }));
  }

  private getEvidenceDays(snapshot: WeekOneSliceSnapshot): readonly number[] {
    return [
      ...new Set(snapshot.miniGame.evidenceFragments.map((fragment) => fragment.day)),
    ].sort((left, right) => left - right);
  }

  private getEvidenceDayRects(layout: Layout, count: number): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const columns = panel.width >= 620 ? 3 : 2;

    return this.getMiniGameItemRects(layout, count, 266, 56, columns);
  }

  private getEvidenceConnectionRects(
    layout: Layout,
    count: number,
    snapshot: WeekOneSliceSnapshot,
  ): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const dayBottom = this.getRectsBottom(
      this.getEvidenceDayRects(layout, this.getEvidenceDays(snapshot).length),
    );
    const columns = panel.width >= 620 ? 3 : 1;

    return this.getMiniGameItemRects(
      layout,
      count,
      dayBottom - panel.y + 8,
      54,
      columns,
    );
  }

  private getEvidenceFinalPackageRect(layout: Layout): Rect {
    const panel = this.getMiniGamePanelRect(layout);

    return {
      x: panel.x + 14,
      y: panel.y + 266,
      width: panel.width - 28,
      height: 82,
    };
  }

  private getEvidenceSubmitRect(
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): Rect {
    const panel = this.getMiniGamePanelRect(layout);
    const y =
      snapshot.miniGame.evidencePath === "final_package"
        ? this.getEvidenceFinalPackageRect(layout).y + this.getEvidenceFinalPackageRect(layout).height + 10
        : this.getRectsBottom(
            this.getEvidenceConnectionRects(
              layout,
              snapshot.miniGame.evidenceConnections.length,
              snapshot,
            ),
          ) + 10;

    return {
      x: panel.x + 14,
      y,
      width: panel.width - 28,
      height: 34,
    };
  }

  private getMiniGameItemRects(
    layout: Layout,
    count: number,
    startOffsetY: number,
    itemHeight: number,
    preferredColumns: number,
  ): readonly Rect[] {
    const panel = this.getMiniGamePanelRect(layout);
    const gap = 8;
    const columns = Math.max(1, Math.min(preferredColumns, Math.max(count, 1)));
    const width = (panel.width - 28 - gap * (columns - 1)) / columns;

    return Array.from({ length: count }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      return {
        x: panel.x + 14 + column * (width + gap),
        y: panel.y + startOffsetY + row * (itemHeight + gap),
        width,
        height: itemHeight,
      };
    });
  }

  private getMiniGameContentBottom(
    layout: Layout,
    snapshot: WeekOneSliceSnapshot,
  ): number {
    switch (snapshot.activeChallenge?.type) {
      case "protocol_match":
        return this.getRectsBottom(
          this.getProtocolTermRects(layout, snapshot.miniGame.protocolTerms.length),
        );
      case "data_cleaning":
        return this.getRectsBottom(
          this.getCleaningItemRects(layout, snapshot.miniGame.cleaningItems.length),
        );
      case "public_opinion":
        return this.getRectsBottom(
          this.getPublicOpinionTacticRects(
            layout,
            snapshot.miniGame.publicOpinionTactics.length,
          ),
        );
      case "profile_puzzle":
        return this.getRectsBottom(
          this.getPuzzleFragmentRects(layout, snapshot.miniGame.puzzleFragments.length),
        );
      case "buyer_negotiation":
        return this.getRectsBottom(
          this.getNegotiationOptionRects(layout, snapshot.miniGame.negotiationOptions.length),
        );
      case "protocol_scan":
        return this.getRectsBottom([
          ...this.getProtocolScanClauseRects(
            layout,
            snapshot.miniGame.protocolScanTemplate?.riskClauses.length ?? 0,
          ),
          ...this.getProtocolScanFlowRects(
            layout,
            snapshot.miniGame.protocolScanTemplate?.dataFlowMatches.length ?? 0,
          ),
          this.getProtocolScanHiddenRect(layout),
          ...this.getProtocolScanRiskAnswerRects(layout),
        ]);
      case "evidence_chain":
        return this.getRectsBottom([
          ...this.getEvidenceDayRects(
            layout,
            this.getEvidenceDays(snapshot).length,
          ),
          ...this.getEvidenceConnectionRects(
            layout,
            snapshot.miniGame.evidenceConnections.length,
            snapshot,
          ),
          this.getEvidenceSubmitRect(layout, snapshot),
        ]);
      default:
        return this.getMiniGamePanelRect(layout).y + 210;
    }
  }

  private getRectsBottom(rects: readonly Rect[]): number {
    return rects.reduce((bottom, rect) => Math.max(bottom, rect.y + rect.height), 0);
  }

  private getChallengeResultRects(layout: Layout): readonly [Rect, Rect] {
    const gap = 10;
    const width = (layout.body.width - gap) / 2;

    return [
      {
        x: layout.body.x,
        y: layout.footer.y - 50,
        width,
        height: 38,
      },
      {
        x: layout.body.x + width + gap,
        y: layout.footer.y - 50,
        width,
        height: 38,
      },
    ];
  }

  private drawPanel(
    context: CanvasRenderingContext2D,
    rect: Rect,
    fillStyle: string,
    strokeStyle: string,
  ): void {
    context.fillStyle = fillStyle;
    context.strokeStyle = strokeStyle;
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(rect.x, rect.y, rect.width, rect.height, 6);
    context.fill();
    context.stroke();
  }

  private drawButton(
    context: CanvasRenderingContext2D,
    rect: Rect,
    label: string,
    active: boolean,
  ): void {
    this.drawPanel(context, rect, active ? "#23483f" : "#172128", active ? "#77b8ad" : "#40505a");
    context.fillStyle = active ? "#d7e2dc" : "#91a09b";
    context.font = "800 11px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
  }

  private drawSectionTitle(
    context: CanvasRenderingContext2D,
    title: string,
    x: number,
    y: number,
  ): void {
    context.fillStyle = "#91c8bd";
    context.font = "800 11px ui-monospace, Consolas, monospace";
    context.fillText(title, x, y);
  }

  private drawMiniBlock(
    context: CanvasRenderingContext2D,
    title: string,
    body: string,
    x: number,
    y: number,
    width: number,
  ): void {
    context.fillStyle = "#91c8bd";
    context.font = "700 10px ui-monospace, Consolas, monospace";
    context.fillText(title, x, y);
    context.fillStyle = "#aebbb7";
    context.font = "500 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, body, x, y + 16, width, 3, 14);
  }

  private drawWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    maxLines: number,
    lineHeight: number,
  ): void {
    const characters = [...text];
    let line = "";
    let lineCount = 0;

    for (const character of characters) {
      const nextLine = `${line}${character}`;

      if (context.measureText(nextLine).width > maxWidth && line) {
        context.fillText(line, x, y + lineCount * lineHeight);
        line = character;
        lineCount += 1;

        if (lineCount >= maxLines) {
          return;
        }
      } else {
        line = nextLine;
      }
    }

    if (line && lineCount < maxLines) {
      context.fillText(line, x, y + lineCount * lineHeight);
    }
  }

  private contains(rect: Rect, point: Point): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }
}
