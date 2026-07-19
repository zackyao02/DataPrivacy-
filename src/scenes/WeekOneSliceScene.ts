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
    const panel = {
      x: layout.body.x,
      y: layout.body.y + 10,
      width: layout.body.width,
      height: layout.body.height - 86,
    };
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
      5,
      16,
    );

    if (snapshot.activeProfilePuzzle && challenge?.type === "profile_puzzle") {
      this.drawMiniBlock(context, "画像拼图", snapshot.activeProfilePuzzle.objective, panel.x + 14, panel.y + 190, panel.width - 28);
    } else if (snapshot.activeNegotiation && challenge?.type === "buyer_negotiation") {
      this.drawMiniBlock(context, "买家谈判", snapshot.activeNegotiation.briefing, panel.x + 14, panel.y + 190, panel.width - 28);
    } else if (challenge) {
      this.drawMiniBlock(context, "目标", challenge.objective, panel.x + 14, panel.y + 190, panel.width - 28);
    }

    if (snapshot.activeBlackBoxLine) {
      this.drawMiniBlock(
        context,
        "黑盒反馈",
        snapshot.activeBlackBoxLine.text,
        panel.x + 14,
        panel.y + panel.height - 88,
        panel.width - 28,
      );
    }

    const [successRect, failRect] = this.getChallengeResultRects(layout);
    this.drawButton(context, successRect, "判定成功", true);
    this.drawButton(context, failRect, "判定失败", false);
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
