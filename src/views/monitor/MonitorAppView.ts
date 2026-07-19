import type { Point } from "../../core/types";
import type { GameEventType } from "../../game/GamePorts";
import type {
  VisibleDataCard,
  VisibleGameState,
  VisibleRiskStatus,
} from "../../game/VisibleGameState";
import {
  MONITOR_APP_LAYOUT,
  type MonitorAppId,
} from "../../scenes/desk/DeskSceneConfig";
import type { Rect } from "../../scenes/desk/InteractiveItem";

export interface MonitorAppFeedback {
  readonly type: GameEventType;
  readonly message: string;
  readonly expiresAt: number;
}

export interface MonitorAppViewState {
  readonly hoveredItemId: string | null;
  readonly pressedItemId: string | null;
  readonly selectedRawCardId: string | null;
  readonly draggingItemId: string | null;
  readonly highlightedSlotIndex: number | null;
  readonly createPackageDisabled: boolean;
  readonly submitTransactionDisabled: boolean;
  readonly packageFeedback: MonitorAppFeedback | null;
  readonly transactionFeedback: MonitorAppFeedback | null;
  readonly riskFeedback: MonitorAppFeedback | null;
  readonly riskFeedbackPulse: number;
}

interface ItemVisualState {
  readonly selected?: boolean;
  readonly hovered?: boolean;
  readonly pressed?: boolean;
  readonly dragging?: boolean;
  readonly disabled?: boolean;
  readonly highlighted?: boolean;
  readonly filled?: boolean;
}

export function renderMonitorAppContent(
  context: CanvasRenderingContext2D,
  appId: MonitorAppId,
  state: Readonly<VisibleGameState>,
  viewState: MonitorAppViewState,
  accent: string,
): void {
  switch (appId) {
    case "data-processing":
      renderDataProcessing(context, state, viewState, accent);
      break;
    case "buyer-trade":
      renderBuyerTrade(context, state, viewState, accent);
      break;
    case "risk-record":
      renderRiskRecord(context, state, viewState, accent);
      break;
  }
}

export function renderMonitorDraggedCard(
  context: CanvasRenderingContext2D,
  point: Point,
  card: VisibleDataCard | null,
  cardId: string,
): void {
  const rect = {
    x: point.x - 78.5,
    y: point.y - 19,
    width: 157,
    height: 38,
  };

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.48)";
  context.shadowBlur = 10;
  context.shadowOffsetY = 5;
  drawCompactRecord(
    context,
    rect,
    cardId,
    card?.title || "未提供标题",
    card ? getSensitivityColor(card.sensitivity) : "#668f99",
    { selected: true, highlighted: true },
  );
  context.restore();
}

function renderDataProcessing(
  context: CanvasRenderingContext2D,
  state: Readonly<VisibleGameState>,
  viewState: MonitorAppViewState,
  accent: string,
): void {
  const rawCards = state.rawCards.slice(0, 6);
  const slotCardIds = state.workbench.slotCardIds.slice(0, 3);
  const packages = state.processedPackages.slice(0, 4);

  drawSectionPanel(
    context,
    { x: 26, y: 118, width: 338, height: 178 },
    `原始数据卡 ${rawCards.length}/6`,
    accent,
  );
  MONITOR_APP_LAYOUT.dataProcessing.rawCardRects.forEach((rect, index) => {
    const card = rawCards[index];

    if (!card) {
      drawEmptyRecord(context, rect, "空数据位");
      return;
    }

    const itemId = `data-raw-card:${card.id}`;
    drawCompactRecord(
      context,
      rect,
      card.id,
      card.title || "未提供标题",
      getSensitivityColor(card.sensitivity),
      {
        selected: viewState.selectedRawCardId === card.id,
        hovered: viewState.hoveredItemId === itemId,
        pressed: viewState.pressedItemId === itemId,
        dragging: viewState.draggingItemId === itemId,
        disabled: card.disabled === true,
      },
    );
  });

  drawSectionPanel(
    context,
    { x: 26, y: 306, width: 338, height: 126 },
    "处理槽位 3",
    accent,
  );
  MONITOR_APP_LAYOUT.dataProcessing.slotRects.forEach((rect, index) => {
    const cardId = slotCardIds[index] ?? null;
    const card = state.rawCards.find((item) => item.id === cardId);
    drawWorkbenchSlot(
      context,
      rect,
      index + 1,
      card?.id ?? null,
      card?.title ?? null,
      card ? getSensitivityColor(card.sensitivity) : accent,
      {
        hovered: viewState.hoveredItemId === `data-slot:${index}`,
        pressed: viewState.pressedItemId === `data-slot:${index}`,
        highlighted: viewState.highlightedSlotIndex === index,
        filled: cardId !== null,
      },
    );
  });

  drawInlineFeedback(context, viewState.packageFeedback, 195, 439);
  drawActionButton(
    context,
    MONITOR_APP_LAYOUT.dataProcessing.createButton,
    "封 装",
    {
      hovered: viewState.hoveredItemId === "data-create-package",
      pressed: viewState.pressedItemId === "data-create-package",
      disabled: viewState.createPackageDisabled,
    },
  );

  drawSectionPanel(
    context,
    { x: 26, y: 490, width: 338, height: 266 },
    `已生成数据包 ${packages.length}/4`,
    accent,
  );
  for (let index = 0; index < 4; index += 1) {
    const rect = {
      x: 34 + (index % 2) * 165,
      y: 520 + Math.floor(index / 2) * 108,
      width: 157,
      height: 96,
    };
    const item = packages[index];

    if (item) {
      drawPackageRecord(context, rect, item.id, item.label, accent);
    } else {
      drawEmptyRecord(context, rect, "空数据包位");
    }
  }
}

function renderBuyerTrade(
  context: CanvasRenderingContext2D,
  state: Readonly<VisibleGameState>,
  viewState: MonitorAppViewState,
  accent: string,
): void {
  const packages = state.processedPackages.slice(0, 4);
  const buyers = state.buyers.slice(0, 3);

  drawSectionPanel(
    context,
    { x: 26, y: 118, width: 338, height: 200 },
    `可出售数据包 ${packages.length}/4`,
    accent,
  );
  MONITOR_APP_LAYOUT.buyerTrade.packageRects.forEach((rect, index) => {
    const item = packages[index];

    if (!item) {
      drawEmptyRecord(context, rect, "空数据包位");
      return;
    }

    drawPackageRecord(context, rect, item.id, item.label, accent, {
      selected: item.id === state.selectedPackageId,
      hovered: viewState.hoveredItemId === `trade-package:${item.id}`,
      pressed: viewState.pressedItemId === `trade-package:${item.id}`,
    });
  });

  drawSectionPanel(
    context,
    { x: 26, y: 328, width: 338, height: 142 },
    `今日买家 ${buyers.length}/3`,
    accent,
  );
  MONITOR_APP_LAYOUT.buyerTrade.buyerRects.forEach((rect, index) => {
    const buyer = buyers[index];

    if (!buyer) {
      drawEmptyRecord(context, rect, "空买家位");
      return;
    }

    drawBuyerRecord(
      context,
      rect,
      buyer.id,
      buyer.displayName,
      accent,
      {
        selected: buyer.id === state.selectedBuyerId,
        hovered: viewState.hoveredItemId === `trade-buyer:${buyer.id}`,
        pressed: viewState.pressedItemId === `trade-buyer:${buyer.id}`,
      },
    );
  });

  drawSectionPanel(
    context,
    { x: 26, y: 480, width: 338, height: 92 },
    "匹配预览",
    accent,
  );
  drawMatchPreview(
    context,
    state.selectedPackageId,
    state.selectedBuyerId,
    accent,
  );
  drawActionButton(
    context,
    MONITOR_APP_LAYOUT.buyerTrade.submitButton,
    "出 售",
    {
      hovered: viewState.hoveredItemId === "trade-submit",
      pressed: viewState.pressedItemId === "trade-submit",
      disabled: viewState.submitTransactionDisabled,
    },
  );

  drawSectionPanel(
    context,
    { x: 26, y: 630, width: 338, height: 126 },
    "交易反馈",
    accent,
  );
  const transaction = state.lastTransactionResult;
  const feedback = viewState.transactionFeedback;
  context.save();
  context.fillStyle = "#33485b";
  context.font = "600 8px ui-monospace, Consolas, monospace";
  context.textBaseline = "top";
  context.fillText(
    feedback
      ? `事件：${feedback.type}`
      : transaction
        ? `状态：${transaction.status}`
        : "状态：暂无交易",
    40,
    666,
  );
  context.font = "500 9px sans-serif";
  drawWrappedText(
    context,
    feedback?.message || transaction?.summary || "等待 Program B 返回交易结果。",
    40,
    687,
    308,
    15,
    3,
  );
  if (viewState.riskFeedback) {
    context.fillStyle = getRiskColor(state.riskStatus);
    context.font = "600 7px ui-monospace, Consolas, monospace";
    context.fillText(
      fitText(
        context,
        `riskChanged · ${viewState.riskFeedback.message}`,
        308,
      ),
      40,
      728,
    );
  }
  context.restore();
}

function renderRiskRecord(
  context: CanvasRenderingContext2D,
  state: Readonly<VisibleGameState>,
  viewState: MonitorAppViewState,
  accent: string,
): void {
  const riskColor = getRiskColor(state.riskStatus);
  const transaction = state.lastTransactionResult;
  const logs = state.riskLogs.slice(0, 4);
  const consequence =
    state.consequenceSummary?.trim() ||
    state.yesterdayNews?.summary ||
    "暂无后果摘要。";

  drawSectionPanel(
    context,
    { x: 26, y: 118, width: 338, height: 110 },
    "当前风险",
    accent,
  );
  context.save();
  context.fillStyle = riskColor;
  context.globalAlpha = viewState.riskFeedback
    ? 0.12 + viewState.riskFeedbackPulse * 0.12
    : 0.12;
  context.shadowColor = viewState.riskFeedback ? riskColor : "transparent";
  context.shadowBlur = viewState.riskFeedback
    ? 3 + viewState.riskFeedbackPulse * 7
    : 0;
  context.fillRect(40, 154, 310, 54);
  context.globalAlpha = 1;
  context.shadowColor = "transparent";
  context.strokeStyle = riskColor;
  context.lineWidth = viewState.riskFeedback
    ? 2 + viewState.riskFeedbackPulse * 1.5
    : 2;
  context.strokeRect(40.5, 154.5, 309, 53);
  context.fillStyle = riskColor;
  context.font = "700 19px ui-monospace, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(getRiskLabel(state.riskStatus), 195, 181);
  context.fillStyle = viewState.riskFeedback ? riskColor : "#677780";
  context.font = "600 7px ui-monospace, Consolas, monospace";
  context.textBaseline = "top";
  context.fillText(
    fitText(
      context,
      viewState.riskFeedback
        ? `riskChanged · ${viewState.riskFeedback.message}`
        : "等待 riskChanged 事件",
      300,
    ),
    195,
    214,
  );
  context.restore();

  drawSectionPanel(
    context,
    { x: 26, y: 238, width: 338, height: 142 },
    "最近交易",
    accent,
  );
  context.save();
  context.fillStyle = "#34495b";
  context.font = "600 8px ui-monospace, Consolas, monospace";
  context.textBaseline = "top";
  context.fillText(`数据包：${transaction?.packageId || "未提供"}`, 40, 274);
  context.fillText(`买家：${transaction?.buyerId || "未提供"}`, 40, 292);
  context.fillText(`结果：${transaction?.status || "暂无"}`, 40, 310);
  context.font = "500 8px sans-serif";
  drawWrappedText(
    context,
    transaction?.summary || "暂无最近交易结果。",
    40,
    334,
    308,
    14,
    2,
  );
  context.restore();

  drawSectionPanel(
    context,
    { x: 26, y: 390, width: 338, height: 212 },
    `风险日志 ${logs.length}`,
    accent,
  );
  if (logs.length === 0) {
    drawEmptyRecord(context, { x: 40, y: 430, width: 310, height: 52 }, "暂无风险日志");
  } else {
    logs.forEach((log, index) => {
      const color = getRiskColor(log.status);
      const y = 424 + index * 40;
      context.save();
      context.fillStyle =
        index === 0 && viewState.riskFeedback
          ? `rgba(236, 239, 232, ${0.82 + viewState.riskFeedbackPulse * 0.18})`
          : "rgba(236, 239, 232, 0.9)";
      if (index === 0 && viewState.riskFeedback) {
        context.shadowColor = color;
        context.shadowBlur = 2 + viewState.riskFeedbackPulse * 5;
      }
      context.strokeStyle = "#8c989f";
      context.fillRect(36, y, 318, 32);
      context.strokeRect(36.5, y + 0.5, 317, 31);
      context.fillStyle = color;
      context.fillRect(42, y + 6, 5, 20);
      context.fillStyle = "#33485b";
      context.font = "600 7px ui-monospace, Consolas, monospace";
      context.textBaseline = "top";
      context.fillText(log.id || "未提供编号", 54, y + 5);
      context.font = "500 7px sans-serif";
      context.fillText(
        fitText(context, log.message || "未提供内容", 278),
        54,
        y + 17,
      );
      context.restore();
    });
  }

  drawSectionPanel(
    context,
    { x: 26, y: 612, width: 338, height: 144 },
    "后果摘要",
    accent,
  );
  context.save();
  context.fillStyle = "#3e4e5d";
  context.font = "500 10px sans-serif";
  drawWrappedText(context, consequence, 40, 650, 308, 17, 5);
  context.restore();
}

function drawSectionPanel(
  context: CanvasRenderingContext2D,
  rect: Rect,
  title: string,
  accent: string,
): void {
  context.save();
  context.fillStyle = "rgba(225, 231, 229, 0.96)";
  context.strokeStyle = "#71808a";
  context.lineWidth = 1;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  context.fillStyle = accent;
  context.fillRect(rect.x + 1, rect.y + 1, rect.width - 2, 22);
  context.fillStyle = "#f2f3e9";
  context.font = "700 8px ui-monospace, Consolas, monospace";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(title, rect.x + 8, rect.y + 12);
  context.restore();
}

function drawCompactRecord(
  context: CanvasRenderingContext2D,
  rect: Rect,
  id: string,
  label: string,
  accent: string,
  state: ItemVisualState = {},
): void {
  context.save();
  if (state.pressed) {
    context.translate(0, 1);
  }
  context.globalAlpha = state.disabled ? 0.48 : state.dragging ? 0.42 : 1;
  context.fillStyle = state.disabled
    ? "#c8cdca"
    : state.selected
      ? `${accent}2f`
      : "#edf0e9";
  context.strokeStyle = state.selected || state.hovered ? accent : "#78858c";
  context.lineWidth = state.selected || state.hovered ? 2 : 1;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  context.fillStyle = accent;
  context.fillRect(rect.x + 5, rect.y + 6, 5, rect.height - 12);
  context.fillStyle = "#30475a";
  context.font = "700 7px ui-monospace, Consolas, monospace";
  context.textBaseline = "top";
  context.fillText(fitText(context, id || "未提供编号", 132), rect.x + 15, rect.y + 6);
  context.font = "500 7px sans-serif";
  context.fillText(fitText(context, label || "未提供内容", 132), rect.x + 15, rect.y + 20);
  if (state.disabled) {
    context.fillStyle = "#5d686d";
    context.font = "700 6px ui-monospace, Consolas, monospace";
    context.textAlign = "right";
    context.fillText("DISABLED", rect.x + rect.width - 7, rect.y + 6);
  }
  drawInteractionOutline(context, rect, state, accent);
  context.restore();
}

function drawEmptyRecord(
  context: CanvasRenderingContext2D,
  rect: Rect,
  label: string,
): void {
  context.save();
  context.fillStyle = "rgba(174, 186, 188, 0.18)";
  context.strokeStyle = "#99a5a7";
  context.setLineDash([4, 3]);
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  context.setLineDash([]);
  context.fillStyle = "#7a888d";
  context.font = "600 7px ui-monospace, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
  context.restore();
}

function drawWorkbenchSlot(
  context: CanvasRenderingContext2D,
  rect: Rect,
  index: number,
  cardId: string | null,
  title: string | null,
  accent: string,
  state: ItemVisualState,
): void {
  context.save();
  if (state.pressed) {
    context.translate(0, 1);
  }
  context.fillStyle = state.highlighted
    ? `${accent}40`
    : cardId
      ? "#e8ece7"
      : "rgba(104, 121, 129, 0.12)";
  context.strokeStyle = state.highlighted || state.hovered
    ? "#4eae78"
    : cardId
      ? accent
      : "#87949a";
  context.lineWidth = state.highlighted || state.hovered || cardId ? 2 : 1;
  context.setLineDash(cardId ? [] : [5, 3]);
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  context.setLineDash([]);
  context.fillStyle = "#5c6b73";
  context.font = "700 7px ui-monospace, Consolas, monospace";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(`SLOT ${index}`, rect.x + 7, rect.y + 7);
  if (state.filled) {
    context.fillStyle = accent;
    context.textAlign = "right";
    context.fillText("FILLED", rect.x + rect.width - 7, rect.y + 7);
    context.textAlign = "left";
  }
  context.fillStyle = "#2f4557";
  context.font = "700 8px ui-monospace, Consolas, monospace";
  context.fillText(cardId || "空槽位", rect.x + 7, rect.y + 28);
  context.font = "500 7px sans-serif";
  context.fillText(fitText(context, title || "等待数据卡", rect.width - 14), rect.x + 7, rect.y + 49);
  context.fillStyle = cardId
    ? state.hovered
      ? "#9d5552"
      : "#6e7b82"
    : "#397458";
  context.font = "700 6px sans-serif";
  context.textAlign = "right";
  if (cardId) {
    context.fillText("点击移除", rect.x + rect.width - 7, rect.y + 65);
  } else if (state.highlighted) {
    context.fillText("松开放入", rect.x + rect.width - 7, rect.y + 65);
  }
  drawInteractionOutline(context, rect, state, accent);
  context.restore();
}

function drawPackageRecord(
  context: CanvasRenderingContext2D,
  rect: Rect,
  id: string,
  label: string,
  accent: string,
  state: ItemVisualState = {},
): void {
  context.save();
  if (state.pressed) {
    context.translate(0, 1);
  }
  context.fillStyle = state.selected ? `${accent}28` : "#edf0e9";
  context.strokeStyle = state.selected || state.hovered ? accent : "#75838c";
  context.lineWidth = state.selected || state.hovered ? 2 : 1;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  context.fillStyle = accent;
  context.fillRect(rect.x + 8, rect.y + 8, 24, 30);
  context.fillStyle = "rgba(238, 241, 234, 0.8)";
  context.fillRect(rect.x + 13, rect.y + 14, 14, 3);
  context.fillRect(rect.x + 13, rect.y + 21, 14, 3);
  context.fillRect(rect.x + 13, rect.y + 28, 10, 3);
  context.fillStyle = "#30475a";
  context.font = "700 7px ui-monospace, Consolas, monospace";
  context.textBaseline = "top";
  context.fillText(fitText(context, id || "未提供编号", rect.width - 50), rect.x + 40, rect.y + 9);
  context.font = "600 8px sans-serif";
  drawWrappedText(context, label || "未提供名称", rect.x + 40, rect.y + 27, rect.width - 50, 13, 3);
  if (state.selected) {
    context.fillStyle = accent;
    context.font = "700 7px sans-serif";
    context.textAlign = "right";
    context.fillText("已选择", rect.x + rect.width - 8, rect.y + rect.height - 16);
  }
  drawInteractionOutline(context, rect, state, accent);
  context.restore();
}

function drawBuyerRecord(
  context: CanvasRenderingContext2D,
  rect: Rect,
  id: string,
  displayName: string,
  accent: string,
  state: ItemVisualState,
): void {
  context.save();
  if (state.pressed) {
    context.translate(0, 1);
  }
  context.fillStyle = state.selected ? `${accent}28` : "#edf0e9";
  context.strokeStyle = state.selected || state.hovered ? accent : "#75838c";
  context.lineWidth = state.selected || state.hovered ? 2 : 1;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  context.fillStyle = accent;
  context.beginPath();
  context.arc(rect.x + rect.width / 2, rect.y + 27, 13, 0, Math.PI * 2);
  context.fill();
  context.fillRect(rect.x + rect.width / 2 - 20, rect.y + 42, 40, 14);
  context.fillStyle = "#30475a";
  context.font = "700 8px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(fitText(context, displayName || "未提供名称", rect.width - 12), rect.x + rect.width / 2, rect.y + 61);
  context.font = "600 6px ui-monospace, Consolas, monospace";
  context.fillText(fitText(context, id || "未提供编号", rect.width - 12), rect.x + rect.width / 2, rect.y + 77);
  if (state.selected) {
    context.fillStyle = accent;
    context.font = "700 6px sans-serif";
    context.fillText("已选择", rect.x + rect.width / 2, rect.y + 86);
  }
  drawInteractionOutline(context, rect, state, accent);
  context.restore();
}

function drawMatchPreview(
  context: CanvasRenderingContext2D,
  packageId: string | null,
  buyerId: string | null,
  accent: string,
): void {
  const leftRect = { x: 40, y: 516, width: 126, height: 40 };
  const rightRect = { x: 224, y: 516, width: 126, height: 40 };
  context.save();
  for (const [rect, value] of [
    [leftRect, packageId || "未选择数据包"],
    [rightRect, buyerId || "未选择买家"],
  ] as const) {
    context.fillStyle = "#edf0e9";
    context.strokeStyle = accent;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
    context.fillStyle = "#30475a";
    context.font = "700 7px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(fitText(context, value, rect.width - 12), rect.x + rect.width / 2, rect.y + rect.height / 2);
  }
  context.fillStyle = accent;
  context.font = "700 16px sans-serif";
  context.fillText("→", 195, 536);
  context.restore();
}

function drawActionButton(
  context: CanvasRenderingContext2D,
  rect: Rect,
  label: string,
  state: ItemVisualState,
): void {
  context.save();
  if (state.pressed) {
    context.translate(0, 1);
  }
  context.fillStyle = state.disabled
    ? "#b9c0c2"
    : state.hovered
      ? "#edf1e7"
      : "#d7dce0";
  context.strokeStyle = state.disabled ? "#77858a" : "#344d63";
  context.lineWidth = 2;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);
  context.fillStyle = state.disabled ? "#758187" : "#243d54";
  context.font = "700 13px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    state.disabled ? `${label} · 等待选择` : label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
  );
  drawInteractionOutline(context, rect, state, "#6c97a4");
  context.restore();
}

function drawInteractionOutline(
  context: CanvasRenderingContext2D,
  rect: Rect,
  state: ItemVisualState,
  accent: string,
): void {
  if (
    !state.selected &&
    !state.hovered &&
    !state.pressed &&
    !state.dragging &&
    !state.disabled &&
    !state.highlighted &&
    !state.filled
  ) {
    return;
  }

  context.save();
  context.globalAlpha = 1;
  context.strokeStyle = state.disabled
    ? "#7f8b8f"
    : state.highlighted
      ? "#55c485"
      : accent;
  context.lineWidth =
    state.selected || state.highlighted || state.pressed || state.filled
      ? 2
      : 1;
  context.setLineDash(state.disabled ? [4, 3] : []);
  context.strokeRect(rect.x + 1.5, rect.y + 1.5, rect.width - 3, rect.height - 3);
  context.restore();
}

function drawInlineFeedback(
  context: CanvasRenderingContext2D,
  feedback: MonitorAppFeedback | null,
  x: number,
  y: number,
): void {
  context.save();
  context.fillStyle = feedback
    ? feedback.type === "packageWasted" || feedback.type === "transactionFailed"
      ? "#9d5552"
      : "#397458"
    : "#6f7c82";
  context.font = "700 7px ui-monospace, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    feedback
      ? `${feedback.type} · ${feedback.message}`
      : "等待 Program B 返回封装事件",
    x,
    y,
    320,
  );
  context.restore();
}

function getSensitivityColor(
  sensitivity: VisibleDataCard["sensitivity"],
): string {
  return { low: "#668f99", medium: "#b18a55", high: "#9d5552" }[
    sensitivity
  ];
}

function getRiskColor(status: VisibleRiskStatus): string {
  return { normal: "#4d8675", warning: "#b88745", critical: "#a54d50" }[
    status
  ];
}

function getRiskLabel(status: VisibleRiskStatus): string {
  return {
    normal: "NORMAL · 正常",
    warning: "WARNING · 警告",
    critical: "CRITICAL · 严重",
  }[status];
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }

  let fitted = text;
  while (fitted.length > 1 && context.measureText(`${fitted}…`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted}…`;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): void {
  const lines: string[] = [];
  let current = "";

  for (const character of Array.from(text)) {
    const candidate = current + character;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = character;
      if (lines.length === maxLines) {
        break;
      }
    } else {
      current = candidate;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  lines.slice(0, maxLines).forEach((line, index) => {
    const truncated = index === maxLines - 1 && lines.length >= maxLines;
    context.fillText(
      truncated && line.length > 1 ? `${line.slice(0, -1)}…` : line,
      x,
      y + index * lineHeight,
    );
  });
}
