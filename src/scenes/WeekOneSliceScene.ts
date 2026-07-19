import { SCENE_LABELS, type Point, type RenderLayer, type SceneId } from "../core/types";
import {
  type EmotionChoice,
  WeekOneSliceController,
  type WeekOneSliceSnapshot,
} from "../game/WeekOneSliceController";
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

export class WeekOneSliceScene implements Scene {
  readonly title: string;

  private lastHandledInputTimestamp = 0;

  constructor(
    readonly id: WeekOneSceneId,
    private readonly controller: WeekOneSliceController,
    private readonly navigate: (sceneId: SceneId) => void,
  ) {
    this.title = SCENE_LABELS[id];
  }

  enter(_frame: SceneFrame): void {}

  exit(_frame: SceneFrame): void {}

  update(frame: SceneFrame): void {
    const input = frame.input.lastEvent;

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
      case "complete-challenge":
        this.controller.completeChallenge(action.succeeded);
        this.navigate("workbench");
        break;
    }
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

      this.drawPanel(context, rect, selected ? "#263d34" : "#141d22", selected ? "#77b8ad" : "#33424a");
      context.fillStyle = selected ? "#9fd6ca" : "#d7e2dc";
      context.font = "700 11px ui-monospace, Consolas, monospace";
      this.drawWrappedText(context, title, rect.x + 9, rect.y + 10, rect.width - 18, 2, 13);
      context.fillStyle = card.sensitivity === "high" ? "#e0a166" : "#87b6ac";
      context.font = "600 9px ui-monospace, Consolas, monospace";
      context.fillText(`${card.dataType} · ${card.sensitivity}`, rect.x + 9, rect.y + rect.height - 18);
    });

    this.drawPanel(context, panel, "#11191e", "#40505a");
    this.drawSectionTitle(context, "工作台槽位", panel.x + 12, panel.y + 14);

    const slotY = panel.y + 42;
    for (let index = 0; index < 3; index += 1) {
      const slotRect = {
        x: panel.x + 12,
        y: slotY + index * 38,
        width: panel.width - 24,
        height: 29,
      };
      const card = snapshot.selectedCards[index];

      this.drawPanel(context, slotRect, "#0c1216", "#2b3a42");
      context.fillStyle = card ? "#d7e2dc" : "#5c6b70";
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

    this.drawButton(context, this.getSealButtonRect(layout), ready ? "封装数据包" : "生成废包提示", Boolean(ready));
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
      case "profile_puzzle":
        this.renderProfilePuzzle(context, layout, snapshot);
        break;
      case "buyer_negotiation":
        this.renderBuyerNegotiation(context, layout, snapshot);
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
      this.drawWrappedText(context, item.description, rect.x + 8, rect.y + 48, rect.width - 16, 2, 12);
    });
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
    context.fillText("Week 1 垂直切片", layout.margin, 26);
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
    const columns = panel.width >= 340 ? 2 : 1;

    return this.getMiniGameItemRects(layout, count, 204, 58, columns);
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
      case "profile_puzzle":
        return this.getRectsBottom(
          this.getPuzzleFragmentRects(layout, snapshot.miniGame.puzzleFragments.length),
        );
      case "buyer_negotiation":
        return this.getRectsBottom(
          this.getNegotiationOptionRects(layout, snapshot.miniGame.negotiationOptions.length),
        );
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
