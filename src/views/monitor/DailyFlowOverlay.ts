import type {
  VisibleDailyChoice,
  VisibleDailyPhase,
  VisibleGameState,
} from "../../game/VisibleGameState";
import type { MonitorAppId } from "../../scenes/desk/DeskSceneConfig";
import type { Rect } from "../../scenes/desk/InteractiveItem";
import type { DailyChallengeSession } from "./DailyChallengeSession";

export type DailyFlowItemId =
  | `daily-choice:${string}`
  | `daily-task-option:${string}`
  | "daily-task-previous"
  | "daily-task-next"
  | "daily-task-submit"
  | "daily-continue"
  | "daily-return-to-desk";

export interface DailyFlowOverlayItem {
  readonly id: DailyFlowItemId;
  readonly label: string;
  readonly rect: Rect;
}

interface DailyFlowOverlayModel {
  readonly phase: VisibleDailyPhase;
  readonly title: string;
  readonly eyebrow: string;
  readonly body: readonly string[];
  readonly choices: readonly VisibleDailyChoice[];
  readonly continueLabel: string | null;
  readonly accent: string;
}

const PANEL_RECT: Rect = { x: 24, y: 154, width: 342, height: 510 };
const CHOICE_RECTS: readonly Rect[] = [
  { x: 44, y: 438, width: 302, height: 52 },
  { x: 44, y: 498, width: 302, height: 52 },
  { x: 44, y: 558, width: 302, height: 52 },
];
const CONTINUE_RECT: Rect = { x: 205, y: 588, width: 141, height: 46 };
const TASK_OPTION_RECTS: readonly Rect[] = [
  { x: 44, y: 408, width: 146, height: 46 },
  { x: 200, y: 408, width: 146, height: 46 },
  { x: 44, y: 462, width: 146, height: 46 },
  { x: 200, y: 462, width: 146, height: 46 },
  { x: 44, y: 516, width: 146, height: 46 },
  { x: 200, y: 516, width: 146, height: 46 },
];
const TASK_PREVIOUS_RECT: Rect = { x: 44, y: 576, width: 92, height: 42 };
const TASK_PRIMARY_RECT: Rect = { x: 200, y: 576, width: 146, height: 42 };

export function isDailyFlowOverlayVisible(
  state: Readonly<VisibleGameState>,
  currentApp: MonitorAppId | null,
): boolean {
  const { phase, challenge } = state.dailyFlow;
  if (phase === "challenge") {
    return Boolean(challenge && currentApp === challenge.requiredApp);
  }
  return (
    phase === "briefing" ||
    phase === "news" ||
    phase === "emotion" ||
    phase === "monologue" ||
    phase === "ending"
  );
}

export function getDailyFlowOverlayItems(
  state: Readonly<VisibleGameState>,
  currentApp: MonitorAppId | null,
  challengeSession?: DailyChallengeSession,
): readonly DailyFlowOverlayItem[] {
  const model = getModel(state, currentApp, challengeSession);
  if (!model) {
    return [];
  }

  if (model.phase === "challenge" && challengeSession) {
    const challenge = state.dailyFlow.challenge;
    const completed = challenge?.status === "success" || challenge?.status === "failed";
    const task = challengeSession.getCurrentTask();
    if (!completed && task) {
      const items: DailyFlowOverlayItem[] = task.options.slice(0, 6).map((option, index) => ({
        id: `daily-task-option:${option.id}`,
        label: option.label,
        rect: TASK_OPTION_RECTS[index],
      }));
      if (challengeSession.getTaskIndex() > 0) {
        items.push({ id: "daily-task-previous", label: "上一步", rect: TASK_PREVIOUS_RECT });
      }
      if (challengeSession.getTaskIndex() < challengeSession.getTaskCount() - 1) {
        items.push({ id: "daily-task-next", label: "下一步", rect: TASK_PRIMARY_RECT });
      } else {
        items.push({ id: "daily-task-submit", label: "提交答案", rect: TASK_PRIMARY_RECT });
      }
      return items;
    }
  }

  if (model.choices.length > 0) {
    return model.choices.slice(0, 3).map((choice, index) => ({
      id: `daily-choice:${choice.id}`,
      label: choice.label,
      rect: CHOICE_RECTS[index],
    }));
  }

  if (model.phase === "news") {
    return [{
      id: "daily-return-to-desk",
      label: "返回工位阅读报纸",
      rect: CONTINUE_RECT,
    }];
  }

  return model.continueLabel
    ? [{ id: "daily-continue", label: model.continueLabel, rect: CONTINUE_RECT }]
    : [];
}

export function renderDailyFlowOverlay(
  context: CanvasRenderingContext2D,
  state: Readonly<VisibleGameState>,
  currentApp: MonitorAppId | null,
  hoveredItemId: string | null,
  pressedItemId: string | null,
  challengeSession?: DailyChallengeSession,
): void {
  const model = getModel(state, currentApp, challengeSession);
  if (!model) {
    return;
  }

  context.save();
  context.fillStyle = "rgba(4, 9, 14, 0.78)";
  context.fillRect(0, 0, 390, 844);
  context.shadowColor = "rgba(0, 0, 0, 0.72)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;
  context.fillStyle = "#d9ddd4";
  context.strokeStyle = "#10273b";
  context.lineWidth = 3;
  context.fillRect(PANEL_RECT.x, PANEL_RECT.y, PANEL_RECT.width, PANEL_RECT.height);
  context.strokeRect(PANEL_RECT.x, PANEL_RECT.y, PANEL_RECT.width, PANEL_RECT.height);
  context.shadowColor = "transparent";

  context.fillStyle = "#0b2b69";
  context.fillRect(PANEL_RECT.x + 4, PANEL_RECT.y + 4, PANEL_RECT.width - 8, 48);
  context.fillStyle = "#f5f1d5";
  context.font = "700 18px ui-monospace, Consolas, monospace";
  context.textBaseline = "middle";
  context.fillText(model.title, 43, 181);

  context.fillStyle = model.accent;
  context.font = "700 11px ui-monospace, Consolas, monospace";
  context.textBaseline = "top";
  context.fillText(model.eyebrow, 44, 222);
  context.fillStyle = "#21313b";
  context.font = "600 12px system-ui, sans-serif";
  let y = 252;
  for (const paragraph of model.body) {
    y = drawWrappedText(context, paragraph, 44, y, 302, 19) + 10;
  }

  for (const item of getDailyFlowOverlayItems(state, currentApp, challengeSession)) {
    const hovered = hoveredItemId === item.id;
    const pressed = pressedItemId === item.id;
    const selected = item.id.startsWith("daily-task-option:") && Boolean(
      challengeSession?.getCurrentTask() &&
      challengeSession.isSelected(
        challengeSession.getCurrentTask()!.id,
        item.id.slice("daily-task-option:".length),
      ),
    );
    const disabled =
      item.id === "daily-task-next" && !challengeSession?.canMoveNext() ||
      item.id === "daily-task-submit" && !challengeSession?.canSubmit();
    context.fillStyle = disabled
      ? "#aeb5b1"
      : pressed
        ? "#9cad9f"
        : selected
          ? "#9fc8c3"
          : hovered
            ? "#c6d4c8"
            : "#eef0e8";
    context.strokeStyle = hovered ? model.accent : "#526570";
    context.lineWidth = hovered ? 3 : 2;
    context.fillRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
    context.strokeRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
    context.fillStyle = disabled ? "#68736f" : "#14242e";
    context.font = "700 12px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(item.label, item.rect.x + item.rect.width / 2, item.rect.y + item.rect.height / 2);
  }

  context.fillStyle = "#526570";
  context.font = "600 9px ui-monospace, Consolas, monospace";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText(`DAY ${state.day} | clarity ${state.clarityScore}`, 43, 648);
  context.restore();
}

function getModel(
  state: Readonly<VisibleGameState>,
  currentApp: MonitorAppId | null,
  challengeSession?: DailyChallengeSession,
): DailyFlowOverlayModel | null {
  if (!isDailyFlowOverlayVisible(state, currentApp)) {
    return null;
  }

  const flow = state.dailyFlow;
  if (flow.phase === "challenge" && flow.challenge) {
    const completed = flow.challenge.status === "success" || flow.challenge.status === "failed";
    const task = challengeSession?.getCurrentTask() ?? flow.challenge.tasks[0] ?? null;
    return {
      phase: flow.phase,
      title: flow.challenge.title,
      eyebrow: `${formatChallengeKind(flow.challenge.kind)} | ${
        challengeSession && challengeSession.getTaskCount() > 0
          ? `${challengeSession.getTaskIndex() + 1}/${challengeSession.getTaskCount()}`
          : flow.challenge.objective
      }`,
      body: [
        flow.challenge.briefing,
        ...(task?.prompt ? [task.prompt] : []),
        ...(flow.blackBoxLine ? [flow.blackBoxLine] : []),
        ...(flow.challenge.feedback ? [flow.challenge.feedback] : []),
      ],
      choices: completed ? [] : flow.challenge.tasks.length > 0 ? [] : flow.challenge.choices,
      continueLabel: completed ? "继续工作" : null,
      accent: completed && flow.challenge.status === "failed" ? "#a64f48" : "#196d72",
    };
  }

  if (flow.phase === "briefing") {
    return {
      phase: flow.phase,
      title: `Day ${state.day} | 今日指令`,
      eyebrow: "BLACK BOX BRIEFING",
      body: [flow.blackBoxLine ?? "今日任务已经下发。完成小关卡后继续处理数据。"],
      choices: [],
      continueLabel: state.day === 7 ? "确认简报" : "进入任务",
      accent: "#196d72",
    };
  }

  if (flow.phase === "emotion") {
    return {
      phase: flow.phase,
      title: "昨日新闻 | 你的反应",
      eyebrow: "EMOTION RESPONSE",
      body: [flow.emotionPrompt ?? "新闻已经播完。你准备如何回应？"],
      choices: [
        { id: "empathy", label: "同情：这不该由数据说了算" },
        { id: "anger", label: "愤怒：凭什么卖掉他们的人生" },
        { id: "numbness", label: "麻木：只是工作，与我无关" },
      ],
      continueLabel: null,
      accent: "#8b6333",
    };
  }

  if (flow.phase === "news") {
    return {
      phase: flow.phase,
      title: "昨日新闻已送达",
      eyebrow: "DESK NEWSPAPER",
      body: [
        state.yesterdayNews?.title ?? "昨日交易的新闻反馈尚未接入。",
        "回到现实工位并点击桌面报纸。报纸仍是唯一新闻入口，不新增新闻 App。",
      ],
      choices: [],
      continueLabel: "返回工位阅读报纸",
      accent: "#8b6333",
    };
  }

  if (flow.phase === "monologue") {
    return {
      phase: flow.phase,
      title: flow.monologue?.title ?? "每日独白",
      eyebrow: flow.monologue?.speaker ?? "PLAYER",
      body: flow.monologue?.textSegments ?? ["今天的记录到此为止。"],
      choices: [],
      continueLabel: flow.monologue?.closingCue ?? "结束今天",
      accent: "#6d5a79",
    };
  }

  const report = state.ending.report;
  return {
    phase: "ending",
    title: report?.endingTitle ?? "最终结算",
    eyebrow: report ? `${report.rating} | ${report.literacyRating}` : "ENDING",
    body: report
      ? [
          report.endingBody,
          `${report.playerNickname} | 完成 ${report.days} 天 | 交易 ${formatEndingMetric(report.totalTransactions)}`,
          ...(report.comment ? [report.comment] : []),
          ...(report.advice ? [report.advice] : []),
        ]
      : [flow.blackBoxLine ?? "七日记录已经封存，等待程序 B 返回最终结局。"],
    choices: [],
    continueLabel: null,
    accent: "#8d4c4c",
  };
}

function formatEndingMetric(value: number | null): string {
  return value === null ? "--" : String(value);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  let line = "";
  let currentY = y;
  for (const character of text) {
    const candidate = line + character;
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, currentY);
      line = character;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) {
    context.fillText(line, x, currentY);
  }
  return currentY + lineHeight;
}

function formatChallengeKind(kind: string): string {
  return kind.replaceAll("-", " ").toUpperCase();
}
