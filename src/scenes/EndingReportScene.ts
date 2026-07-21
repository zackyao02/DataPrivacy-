import {
  SCENE_LABELS,
  type Point,
  type RenderLayer,
  type SceneId,
} from "../core/types";
import {
  WeekOneSliceController,
  type WeekOneEndingReport,
  type WeekOneSaveStatus,
} from "../game/WeekOneSliceController";
import type { Scene, SceneFrame } from "./Scene";

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Layout {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
  readonly header: Rect;
  readonly body: Rect;
  readonly footer: Rect;
  readonly report: Rect;
  readonly actions: Rect;
}

type EndingAction = "copy-share" | "clear-save" | "workbench";

interface HitZone {
  readonly rect: Rect;
  readonly action: EndingAction;
}

const SAVE_STATUS_LABELS: Record<WeekOneSaveStatus, string> = {
  unavailable: "未发现本地存档",
  loaded: "已读取本地存档",
  saved: "已自动保存",
  cleared: "本地存档已清除",
  error: "存档读写异常",
};

export class EndingReportScene implements Scene {
  readonly id: Extract<SceneId, "ending"> = "ending";
  readonly title = SCENE_LABELS.ending;

  private lastHandledInputTimestamp = 0;

  constructor(
    private readonly controller: WeekOneSliceController,
    private readonly navigate: (sceneId: SceneId) => void,
  ) {}

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

    const layout = this.createLayout(frame);
    const hitZone = this.getHitZones(layout).find((zone) =>
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
    const report = snapshot.endingReport;

    switch (layer) {
      case "background":
        this.renderBackground(context, layout);
        break;
      case "devices":
        this.renderReportShell(context, layout);
        break;
      case "cards":
        this.renderReport(context, layout, report);
        this.renderActions(context, layout, snapshot);
        break;
      case "ui":
        this.renderUi(context, layout, report);
        break;
      case "effects":
        this.renderPointer(context, frame.input.lastEvent?.position ?? null);
        break;
    }
  }

  private handleAction(action: EndingAction): void {
    switch (action) {
      case "copy-share":
        this.controller.copyShareText();
        break;
      case "clear-save":
        this.controller.clearSave();
        break;
      case "workbench":
        this.navigate("workbench");
        break;
    }
  }

  private renderBackground(context: CanvasRenderingContext2D, layout: Layout): void {
    context.fillStyle = "#0b0d10";
    context.fillRect(0, 0, layout.width, layout.height);
    context.strokeStyle = "#1b2528";
    context.lineWidth = 1;

    for (let x = 0; x < layout.width; x += 30) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, layout.height);
      context.stroke();
    }

    for (let y = 0; y < layout.height; y += 30) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(layout.width, y);
      context.stroke();
    }
  }

  private renderReportShell(context: CanvasRenderingContext2D, layout: Layout): void {
    this.drawPanel(context, layout.body, "rgba(8, 13, 16, 0.9)", "#28383f");
    this.drawPanel(context, layout.report, "#12191d", "#425159");
    this.drawPanel(context, layout.actions, "#10161a", "#33444b");
  }

  private renderReport(
    context: CanvasRenderingContext2D,
    layout: Layout,
    report: WeekOneEndingReport,
  ): void {
    const rect = layout.report;
    const gradeColor = report.grade === "B+" ? "#9fd6ca" : "#e0a166";

    context.fillStyle = "#91c8bd";
    context.font = "800 11px ui-monospace, Consolas, monospace";
    context.fillText(report.subtitle, rect.x + 18, rect.y + 24);

    context.fillStyle = "#e7eee9";
    context.font = "800 22px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, report.title, rect.x + 18, rect.y + 50, rect.width - 112, 1, 24);

    this.drawPanel(
      context,
      { x: rect.x + rect.width - 78, y: rect.y + 26, width: 52, height: 52 },
      report.grade === "B+" ? "#18352f" : "#35261c",
      gradeColor,
    );
    context.fillStyle = gradeColor;
    context.font = "900 20px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(report.grade, rect.x + rect.width - 52, rect.y + 52);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";

    context.fillStyle = "#d7e2dc";
    context.font = "700 12px ui-monospace, Consolas, monospace";
    context.fillText(`玩家昵称：${report.nickname}`, rect.x + 18, rect.y + 96);
    context.fillText(report.durationText, rect.x + 18, rect.y + 116);
    context.fillText(`结局：${report.endingTitle}`, rect.x + 18, rect.y + 136);

    const stats = [
      `经手数据条数：${report.soldDataCount}`,
      `打包数据包：${report.packageCount}`,
      `买家数量：${report.buyerCount}`,
      `影响用户：${report.affectedUserCount}`,
    ];

    context.fillStyle = "#91c8bd";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    stats.forEach((item, index) => {
      const x = rect.x + 18 + (index % 2) * Math.max(160, rect.width * 0.43);
      const y = rect.y + 168 + Math.floor(index / 2) * 22;
      context.fillText(item, x, y);
    });

    this.renderTagLine(context, "泄露数据类型", report.dataTypes.join(" / "), rect.x + 18, rect.y + 226, rect.width - 36);
    this.renderTagLine(context, "数据用途", report.dataUses.join(" / "), rect.x + 18, rect.y + 278, rect.width - 36);
    this.renderTagLine(
      context,
      "徽章",
      report.badges.length ? report.badges.join(" / ") : "暂无",
      rect.x + 18,
      rect.y + 330,
      rect.width - 36,
    );

    context.fillStyle = gradeColor;
    context.font = "800 11px ui-monospace, Consolas, monospace";
    context.fillText("评级评语", rect.x + 18, rect.y + rect.height - 128);
    context.fillStyle = "#d7e2dc";
    context.font = "600 11px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      report.ratingComment,
      rect.x + 18,
      rect.y + rect.height - 106,
      rect.width - 36,
      2,
      15,
    );
    context.fillStyle = "#aebbb7";
    context.font = "500 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(
      context,
      report.adviceText,
      rect.x + 18,
      rect.y + rect.height - 60,
      rect.width - 36,
      2,
      14,
    );
  }

  private renderActions(
    context: CanvasRenderingContext2D,
    layout: Layout,
    snapshot: ReturnType<WeekOneSliceController["getSnapshot"]>,
  ): void {
    const rect = layout.actions;
    const report = snapshot.endingReport;

    context.fillStyle = "#91c8bd";
    context.font = "800 11px ui-monospace, Consolas, monospace";
    context.fillText("分享文案", rect.x + 14, rect.y + 24);
    context.fillStyle = "#d7e2dc";
    context.font = "600 11px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, report.shareText, rect.x + 14, rect.y + 46, rect.width - 28, 5, 15);

    context.fillStyle = "#91c8bd";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.fillText("存档", rect.x + 14, rect.y + 132);
    context.fillStyle = "#aebbb7";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    const saveTime = snapshot.saveState?.last_save_time
      ? snapshot.saveState.last_save_time.replace("T", " ").slice(0, 19)
      : "无";
    this.drawWrappedText(
      context,
      `${SAVE_STATUS_LABELS[snapshot.saveStatus]} · 最后保存：${saveTime}`,
      rect.x + 14,
      rect.y + 151,
      rect.width - 28,
      3,
      14,
    );

    if (snapshot.shareMessage) {
      context.fillStyle = "#e0a166";
      context.font = "700 10px ui-monospace, Consolas, monospace";
      this.drawWrappedText(
        context,
        snapshot.shareMessage,
        rect.x + 14,
        rect.y + 205,
        rect.width - 28,
        2,
        14,
      );
    }

    for (const zone of this.getHitZones(layout)) {
      const label =
        zone.action === "copy-share"
          ? "复制分享文案"
          : zone.action === "clear-save"
            ? "清除本地存档"
            : "回到工作台";
      this.drawButton(context, zone.rect, label, zone.action === "copy-share");
    }
  }

  private renderUi(
    context: CanvasRenderingContext2D,
    layout: Layout,
    report: WeekOneEndingReport,
  ): void {
    context.fillStyle = "rgba(4, 7, 9, 0.9)";
    context.fillRect(layout.header.x, layout.header.y, layout.header.width, layout.header.height);
    context.fillRect(layout.footer.x, layout.footer.y, layout.footer.width, layout.footer.height);

    context.fillStyle = "#e7eee9";
    context.font = "800 17px ui-monospace, Consolas, monospace";
    context.fillText("Program C 结局报告", layout.margin, 26);
    context.fillStyle = "#91c8bd";
    context.font = "700 10px ui-monospace, Consolas, monospace";
    context.fillText(`${this.title} · ${report.endingTitle} · 评级 ${report.grade}`, layout.margin, 47);

    context.fillStyle = "#aebbb7";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, report.qrPrompt, layout.margin, layout.footer.y + 18, layout.width - layout.margin * 2, 2, 14);
  }

  private renderTagLine(
    context: CanvasRenderingContext2D,
    title: string,
    text: string,
    x: number,
    y: number,
    width: number,
  ): void {
    context.fillStyle = "#91c8bd";
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.fillText(title, x, y);
    context.fillStyle = "#d7e2dc";
    context.font = "600 10px ui-monospace, Consolas, monospace";
    this.drawWrappedText(context, text, x, y + 17, width, 2, 14);
  }

  private createLayout(frame: SceneFrame): Layout {
    const width = frame.viewport.logicalWidth;
    const height = frame.viewport.logicalHeight;
    const margin = Math.max(14, Math.min(width, height) * 0.035);
    const headerHeight = 64;
    const footerHeight = 56;
    const body: Rect = {
      x: margin,
      y: headerHeight + margin,
      width: width - margin * 2,
      height: height - headerHeight - footerHeight - margin * 2,
    };
    const wide = body.width >= 760;

    if (wide) {
      const actionWidth = Math.min(300, body.width * 0.34);
      return {
        width,
        height,
        margin,
        header: { x: 0, y: 0, width, height: headerHeight },
        footer: { x: 0, y: height - footerHeight, width, height: footerHeight },
        body,
        report: {
          x: body.x + 12,
          y: body.y + 12,
          width: body.width - actionWidth - 36,
          height: body.height - 24,
        },
        actions: {
          x: body.x + body.width - actionWidth - 12,
          y: body.y + 12,
          width: actionWidth,
          height: body.height - 24,
        },
      };
    }

    const actionsHeight = Math.min(260, Math.max(220, body.height * 0.34));

    return {
      width,
      height,
      margin,
      header: { x: 0, y: 0, width, height: headerHeight },
      footer: { x: 0, y: height - footerHeight, width, height: footerHeight },
      body,
      report: {
        x: body.x + 12,
        y: body.y + 12,
        width: body.width - 24,
        height: body.height - actionsHeight - 32,
      },
      actions: {
        x: body.x + 12,
        y: body.y + body.height - actionsHeight - 12,
        width: body.width - 24,
        height: actionsHeight,
      },
    };
  }

  private getHitZones(layout: Layout): readonly HitZone[] {
    const rect = layout.actions;
    const gap = 8;
    const buttonHeight = 34;
    const y = rect.y + rect.height - buttonHeight - 14;
    const wideButtons = rect.width >= 280;

    if (wideButtons) {
      const buttonWidth = (rect.width - 28 - gap * 2) / 3;
      const actions: readonly EndingAction[] = ["copy-share", "clear-save", "workbench"];

      return actions.map((action, index) => ({
        rect: {
          x: rect.x + 14 + index * (buttonWidth + gap),
          y,
          width: buttonWidth,
          height: buttonHeight,
        },
        action,
      }));
    }

    return [
      {
        rect: { x: rect.x + 14, y: y - 84, width: rect.width - 28, height: buttonHeight },
        action: "copy-share",
      },
      {
        rect: { x: rect.x + 14, y: y - 42, width: rect.width - 28, height: buttonHeight },
        action: "clear-save",
      },
      {
        rect: { x: rect.x + 14, y, width: rect.width - 28, height: buttonHeight },
        action: "workbench",
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
    context.font = "800 10px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
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
    const chars = Array.from(text);
    let line = "";
    let lineCount = 0;

    for (const char of chars) {
      const next = `${line}${char}`;

      if (context.measureText(next).width > maxWidth && line) {
        context.fillText(line, x, y + lineCount * lineHeight);
        line = char;
        lineCount += 1;

        if (lineCount >= maxLines) {
          return;
        }
      } else {
        line = next;
      }
    }

    if (line && lineCount < maxLines) {
      context.fillText(line, x, y + lineCount * lineHeight);
    }
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

  private contains(rect: Rect, point: Point): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }
}
