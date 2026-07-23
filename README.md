# 程序 A：H5 Canvas 2D 主线与每日流程接入

项目使用轻量的 TypeScript + Vite 和原生 Canvas 2D，不包含 UI 框架，也不在程序 A 中实现程序 B 的游戏规则。目前包含现实工位、显示器电脑主页和三个 App 的显示/交互层。

## Day2：完整显示器 mock 流程

- 现实桌面已接入显示器、报纸、文件与托盘热区；文件递交会调用 `submitCardToOperationPad(cardId)`，并由本地 mock adapter 回写 `visibleState.operationPadCardId`。
- 显示器主页仅保留数据处理、买家交易、风险记录三个入口；三个 App 均可关闭回主页，再返回现实桌面。
- mock `VisibleGameState` 提供 6 张 `rawCards`、3 个 `workbench.slotCardIds`、初始 3 个 `processedPackages` 和 3 个 `buyers`。封装成功会补入第 4 个 mock 数据包，以便从桌面到交易页完整验证显示状态流。
- 所有操作统一经过 `GameCommandPort`，在控制台打印 command，并由本地 mock handler 更新可见状态或发出反馈事件；没有实现配方、消耗、买家匹配、收益或风险计算规则。
- Pointer Events、点击/拖拽阈值、`selected / hover / dragging / disabled / highlight` 状态、竖屏优先适配和横屏基础兼容沿用现有 Canvas 框架。

## Day3：A/B/C adapter 层

程序 A 的场景帧现在只携带 `VisibleGameState`，Canvas 场景和视图不会读取程序 B 的完整 `GameState`。所有操作仍只经过 `GameCommandPort`。默认运行时使用 `MockBAdapter` 和 mock `CAdapter`；队友分支接入时通过 `ProgramACanvasApp` 的第三个构造参数替换 adapter，不需要修改场景或三个 App。

接口职责：

- `GameStatePort`：只向 A 提供 `getVisibleState()` 和 `onVisibleStateChange()`。
- `GameCommandPort`：A 发出桌面递交、槽位、封装、选择和交易操作，不接收业务返回值。
- `BAdapter`：唯一允许读取 B 真实 state 的转换层；负责把 B state 投影为 A 的 `VisibleGameState`，并把 A 命令转调到 B 函数。
- `CAdapter`：正式边界为 `audio.handleGameEvent(eventName)`；九个 content 方法仅用于联调检查，不能作为 A 的正式业务数据源。
- `MockBAdapter`：保留 Day2 的本地状态更新和反馈，确保 B/C 包尚未合并时现有流程仍可运行。

### B state → A VisibleGameState

| 程序 B 字段 | 程序 A 字段 | 约定 |
| --- | --- | --- |
| `rawCards` | `rawCards` | 最多投影前 6 张；标题、摘要、敏感度和 disabled 只做显示映射 |
| `workbench[0..2]` | `workbench.slotCardIds` | B 当前有 4 槽，A UI 固定只读写前 3 槽；`workbench[3]` 不显示也不由 A 操作 |
| `packageInventory` | `processedPackages` | 最多投影前 4 个 |
| `buyers` | `buyers` | 最多投影前 3 个 |
| `dailyNews` | `yesterdayNews` | 映射标题、摘要和日期标签；A 不直接调用 C 生成新闻 |
| `risk` | `riskStatus` + `riskMetrics` | 接收 B 的 `regulatory / publicOpinion / internalSuspicion` 数值，分别只读展示，并按最高值映射为 `normal / warning / critical` |
| `transactions` 最新一条 | `lastTransactionResult` | 当前约定数组最后一条是最新交易 |
| `transactions` 与 `risk.logs/history` | `riskLogs` | 合并为最多 4 条可见日志；真实去重和业务文案由 B 决定 |

四槽冲突的联调结论：`PROGRAM_A_WORKBENCH_SLOT_COUNT` 固定为 `3`。`BAdapter` 会拒绝 A 发往索引 `3` 的命令，并且转换状态时只读取 `workbench[0]`、`workbench[1]`、`workbench[2]`。

### A command → B function

| `GameCommandPort` | `feature/program-b-logic-framework` bindings |
| --- | --- |
| `placeCardToSlot(cardId, slotIndex)` | `placeCardToSlot(gameState, cardId, slotIndex)` |
| `removeCardFromSlot(slotIndex)` | `removeCardFromSlot(gameState, slotIndex)` |
| `createPackage(preferredRecipeId?)` | `createPackage(gameState, preferredRecipeId)` |
| `submitTransaction(packageId, buyerId)` | `sellPackage(gameState, packageId, buyerId)` |
| `submitCardToOperationPad(cardId)` | 暂无明确 B API，继续由 adapter 本地 mock `operationPadCardId` |
| `selectPackage` / `selectBuyer` | A 的匹配预览选择状态；不触发 B 业务判断 |

真实 B 函数会原地更新 state，并返回 `{ ok, code, message, package, candidates, transaction, isWaste }` 操作结果；`BAdapter` 不会再把该结果误当成新 state。若 `createPackage` 返回 `code: "AMBIGUOUS_COMBINATION"` 与 `candidates: [{ id, name, description }]`，A 在数据处理 App 内显示候选配方，玩家选择后把 `candidate.id` 作为 `preferredRecipeId` 再次调用 B。A 不判断哪个配方有效。若未来 B 改成不可变 state，可显式提供 `resolveStateResult(result)` 和 `setState(state)`。异步 Promise 或字段结构变化仍必须只在 `BAdapter` 内适配，不能泄漏到 A 的场景代码。

### C adapter 与统一事件

正式 C 边界：

```ts
audio.handleGameEvent(eventName);
```

统一事件名为：`packageCreated`、`packageSealed`、`wasteCreated`、`transactionSuccess`、`transactionSealed`、`riskChanged`、`newsGenerated`、`newsBroadcast`、`cardMovedToSlot`、`endingTriggered`。

- `packageCreated` / `transactionSuccess` 是 A 的主反馈事件。
- `packageSealed` / `transactionSealed` 供 C 播放封装、成交音效或补充动画。
- `packageWasted`、`transactionFailed`、`cardSubmittedToOperationPad` 仅作为 Day2 mock/兼容事件保留，不属于新的正式事件清单；封装失败的新名称是 `wasteCreated`。
- C 的 `findPackagePreviews`、`pickNewsForPackage`、`findChallengeByDay`、`findDataCleaningIcon`、`pickPublicOpinionScript`、`pickProfilePuzzleByDay`、`pickBuyerNegotiationScript`、`findDailyMonologueByDay`、`pickBlackBoxLine` 只挂在 `CAdapter` 调试面，不允许 A 用它们替代 `VisibleGameState`。正式内容应由 B 调用 C 后整理进可见状态。

直接构造接入示意：

```ts
const bAdapter = new BAdapter<ActualBGameState>(programBBindings);
const cAdapter = new CAdapter({
  audio: programCAudio,
  contentDebug: programCContentDebug,
});

const app = new ProgramACanvasApp(canvas, debugRoot, {
  bAdapter,
  cAdapter,
});
```

当前默认启动仍使用 mock；真实 B/C 源码尚未合并到 A 分支。适配层已经按队友分支的现有字段、原地 mutation/operation result 语义、九个 C content 方法与字符串音效事件完成校准。待合并后只需在组合根注入真实 `ProgramBBindings`、C audio 和 content 对象；桌面托盘提交仍需 B 补充正式 API。

### 运行时自动接线

`src/main.ts` 会在创建 Canvas 应用前读取 `window.programAIntegrations`。团队合并时可以在主入口之前登记 B/C，无需修改现实桌面、电脑主页或三个 App：

```ts
import * as programB from "./game";
import { AudioManager } from "./program-c/audio";
import { createDefaultContentRepository } from "./program-c/content";

const gameState = programB.createGame({ seed: "team-build" });
programB.startDay(gameState);

window.programAIntegrations = {
  programB: {
    getState: () => gameState,
    placeCardToSlot: programB.placeCardToSlot,
    removeCardFromSlot: programB.removeCardFromSlot,
    createPackage: programB.createPackage,
    sellPackage: programB.sellPackage,
    // 直接登记时需要适配下列方法；使用 createProgramBNativeBindings
    // 会自动把 B 的 applyEmotionChoice 转换为 selectEmotion。
    // submitCardToOperationPad,
    // submitDailyChallenge,
    // advanceDailyPhase,
  },
  programC: {
    audio: new AudioManager({ masterVolume: 0.72 }),
    contentDebug: createDefaultContentRepository(),
  },
};

await import("./main");
```

### 对接程序 B 当前原生 API

程序 B 的当前公开 API 使用 `applyEmotionChoice`，并分别提供七天挑战判定函数。A 提供 `createProgramBNativeBindings`，用于直接接入现有打包、交易和情绪接口，避免重复手写基础胶水代码：

```ts
import {
  applyEmotionChoice,
  createGame,
  createPackage,
  placeCardToSlot,
  removeCardFromSlot,
  sellPackage,
  startDay,
} from "./game";
import { createProgramBNativeBindings } from "./adapters/RuntimeAdapters";

const gameState = createGame();
startDay(gameState);

window.programAIntegrations = {
  programB: createProgramBNativeBindings({
    getGameState: () => gameState,
    api: {
      placeCardToSlot,
      removeCardFromSlot,
      createPackage,
      sellPackage,
      applyEmotionChoice,
    },
    flow: {
      // 这些流程仍由 B 按正式规则提供，A 不在前端伪造判定。
      submitCardToOperationPad,
      submitDailyChallenge,
      advanceDailyPhase,
    },
  }),
};

await import("./main");
```

接线器会自动把 A 的 `empathy / anger / numbness` 转换成 B 当前使用的 `sympathy / anger / numb`。七个分日挑战函数应由 B 在 `submitDailyChallenge(challengeId, response)` 内按当前天数和挑战类型统一分发；旧的 `submitDailyChallengeChoice` 仅保留给单题单选关卡兼容使用。页面内的简报、挑战结果、处理、交易、新闻、情绪和独白切换属于 A 的展示流程；只有独白结束后的日期结转需要调用 B 的 `endDay/startDay` 规则。原生连接器现在可以直接接收这两个现有函数并按顺序执行。

`dailyMonologue` 同时兼容 C 的 `textSegments` 格式与 B 当前的 `start / end` 格式；`ending_report` 会映射为程序 A 的只读结局摘要，评分和结局仍完全由程序 B 决定。

登记代码必须先于 `main.ts` 执行。启动后可在控制台检查：

```ts
window.programAIntegrationStatus;
// mode: "mock" | "program-b" | "program-c" | "program-b+c"
// programBMainlineReady: false 时查看 missingProgramBMethods
```

若 B 登记对象缺少 `getState / placeCardToSlot / removeCardFromSlot / createPackage / sellPackage` 中任一方法，A 会打印明确警告并回退到 mock B，避免半接入状态导致页面静默失效。核心方法已连接、但主线命令仍缺失时，`programBConnected` 保持为 `true`，同时 `programBMainlineReady` 为 `false`，缺口列在 `missingProgramBMethods`。使用 `createProgramBNativeBindings` 后，B 的 `applyEmotionChoice` 会自动补成 `selectEmotion`；A 已自行处理页面阶段切换，因此当前团队必须统一的真实缺口是 `submitCardToOperationPad` 与结构化 `submitDailyChallenge`。若 B 暂时只提供旧的 `submitDailyChallengeChoice`，单题单选仍可运行，但多选和多步骤关卡必须补结构化接口。`advanceDailyPhase` 仍作为可选日期结转钩子保留，没有该钩子时 A 会停在每日独白，不会伪造下一天。移动端第一次 `pointerdown` 会调用 C 的可选 `audio.unlock()`，其后所有音效仍只通过统一 `handleGameEvent(eventName)` 分发。

## 每日流程 UI 与节奏位置

每日内容不会新增第四个 App。程序 B 把程序 C 的内容整理为 `VisibleGameState.dailyFlow` 后，程序 A 按阶段在现有场景内显示覆盖层：

```text
briefing → challenge → processing → trading → news → emotion → monologue → ending
```

- Day1 协议伪装、Day2 数据清洗、Day4 用户画像，以及后续数据类小关卡：显示在“数据处理”App 内。
- Day5 买家谈判：显示在“买家交易”App 内。
- `briefing`、`emotion`、`monologue`、`ending`：作为全局覆盖层显示，不占用桌面 App 入口。
- “昨日新闻”仍由现实工位桌面的报纸承担；`news` 是 B 的流程阶段，不新增新闻 App。
- “风险记录”保持只读，不承载规则操作；它只展示交易后果、风险日志和后果摘要。

A 使用三个每日流程命令，其中只有前两个要求 B 判定或记录业务状态：

| A 命令 | B 的职责 |
| --- | --- |
| `submitDailyChallenge(challengeId, response)` | 接收各任务页答案，分发七天判定函数并更新 challenge 状态和反馈 |
| `selectEmotion(emotion)` | 记录 `empathy / anger / numbness` 并推进流程 |
| `advanceDailyPhase()` | A 在页面内自行切换展示阶段；每日独白结束时才通过可选钩子请求 B 执行日期结转 |

`VisibleGameState` 新增 `conscience` 与 `dailyFlow`。其中 `dailyFlow.challenge.requiredApp` 只能是 `data-processing` 或 `buyer-trade`，A 只负责在对应 App 打开时展示和发送命令，不判断答案、收益、风险或结局。真实 B 尚需统一桌面递交与七日挑战提交两个命令，并把 C 的挑战、黑盒台词、情绪提示和独白内容写入可见状态。B 的 `createPackage`、`sellPackage` 和 `applyEmotionChoice` 成功后，A 只更新展示阶段，不复制业务计算。

结构化挑战约定：B 将当天内容整理到 `dailyFlow.challenge.tasks`。每个任务包含 `id / prompt / selectionMode / minSelections / maxSelections / options`；为适配 `390x844` 手机界面，每个任务页最多放 6 个选项，更多内容拆成连续任务页。A 负责选择、上一页/下一页和提交，最终发送：

```ts
submitDailyChallenge(challengeId, {
  kind: "data-cleaning",
  answers: [
    { taskId: "cleaning-page-1", optionIds: ["clean-face", "clean-id"] },
    { taskId: "cleaning-page-2", optionIds: ["clean-health"] },
  ],
});
```

B 负责把所有任务页答案聚合后调用对应 Day1-Day7 判定函数，返回成功/失败与正式状态；A 不持有正确答案。

### 当前 mock 每日流程

当前 mock 用于在真实 B/C 合并前验收程序 A 的显示和接口闭环，不代表程序 A 接管正式游戏规则：

- 启动后进入 Day1 briefing，再按顺序进入小关卡、数据处理、买家交易和每日独白。
- Day1 没有“昨日新闻”和情绪选择；结束独白后进入 Day2 `news`。
- Day2 起，成功交易后先进入 `monologue`；结束独白并结转日期后才进入下一天 `news`。显示器提示玩家返回现实工位，点击桌面报纸后进入后续阶段，不会新增新闻 App。
- 情绪选项的 mock 清醒值变化遵循最新文本配置：同情 `+1`、愤怒 `+2`、麻木 `-1`；正式记录和结局判断仍属于程序 B。
- 数据包生成后 mock 会清空三个槽位并进入交易阶段；交易后是否成功、风险和收益的正式判定仍属于程序 B。
- Day1 至 Day7 都有可替换的 mock 小关卡壳。Day4 画像拼图、Day5 买家谈判等正式内容仍由程序 C 提供，再由程序 B 整理进 `VisibleGameState.dailyFlow`。

每日流程调试 API：

```ts
window.programA.advanceDailyPhase();
window.programA.submitDailyChallenge("DAY-1-CHALLENGE", {
  kind: "protocol-match",
  answers: [{ taskId: "task-1", optionIds: ["choice-1"] }],
});
window.programA.selectEmotion("empathy");
```

横屏当前按“基础兼容”验收：保持竖屏主画面比例并居中显示，允许两侧留空；要求无明显拉伸、Canvas 空白或交互错位。横屏专用重排和视觉精修后置。

## 启动方式

```bash
npm install
npm run dev
```

终端会输出本地访问地址，通常为 `http://localhost:5173`。

如果 Windows PowerShell 的执行策略阻止 `npm.ps1`，改用：

```powershell
npm.cmd install
npm.cmd run dev
```

生产构建与类型检查：

```bash
npm run typecheck
npm run build
npm run preview
```

## 目录结构

```text
.
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts              # 统一 Windows 映射目录与真实目录
└─ src
   ├─ app
   │  └─ ProgramACanvasApp.ts   # 程序 A 总入口、生命周期和公开 API
   ├─ core
   │  ├─ CanvasSurface.ts       # CSS 尺寸、实际像素、DPR、逻辑坐标
   │  ├─ events.ts              # 程序 A 内部事件类型
   │  ├─ GameLoop.ts            # requestAnimationFrame、update/render
   │  ├─ InputManager.ts        # Pointer Events、点击、触摸、拖拽
   │  ├─ TypedEventBus.ts       # 类型化内部事件总线
   │  └─ types.ts               # 场景、图层、输入和视口公共类型
   ├─ assets
   │  ├─ ImageAssetStore.ts     # 图片加载、失败状态与资源释放
   │  └─ ProgramAAssetManifest.ts # 程序 A 素材 URL 的唯一清单
   ├─ adapters
   │  ├─ BAdapter.ts            # 真实 B state/command 到 A ports 的唯一转换层
   │  ├─ MockBAdapter.ts        # Day2 可运行的本地 mock handler
   │  └─ CAdapter.ts            # C 音频正式边界与 content 调试接口
   ├─ debug
   │  └─ DebugPanel.ts          # 场景、图层、循环、输入验收面板
   ├─ game
   │  ├─ GamePorts.ts           # GameState/GameCommand/Audio/Event ports
   │  ├─ ProgramBBridge.ts      # MockBAdapter 使用的本地状态/事件容器
   │  └─ VisibleGameState.ts    # 程序 A 可见状态与 mock 数据
   ├─ render
   │  ├─ CanvasPlaceholder.ts   # 素材加载失败时的统一占位绘制
   │  └─ LayerRenderer.ts       # 五层顺序渲染及图层开关
   ├─ scenes
   │  ├─ desk                   # 390×844 坐标与统一交互结构
   │  ├─ MonitorRoomScene.ts    # 现实工位桌面主场景
   │  ├─ MonitorDesktopScene.ts # 电脑主页/App 交互编排与命中测试
   │  ├─ PlaceholderScene.ts    # 矩形、文字、色块测试内容
   │  ├─ Scene.ts               # 场景协议
   │  └─ SceneManager.ts        # 场景状态机与切换
   ├─ views
   │  └─ monitor
   │     └─ MonitorAppView.ts   # 三个 App 的纯 Canvas 页面绘制
   ├─ main.ts
   └─ styles.css
```

## 已实现功能

- 初始化 `CanvasRenderingContext2D`。
- 使用 `requestAnimationFrame` 驱动动画循环。
- `update(deltaTime)` 与 `render()` 分离，`deltaTime` 使用秒并限制最大值，避免切回标签页时跳帧过大。
- 玩家主线场景只使用 `monitor-room`（现实桌面）和 `monitor-desktop`（电脑主页及三个 App）。
- Day1 的 `workbench`、`buyer-exchange`、`risk-panel`、`news`、`mini-game`、`ending` 占位场景继续注册在状态机中，但只用于 Debug 面板和数字快捷键，不存在玩家按钮、默认入口、控制台入口或自动跳转。
- 固定按 `background → devices → cards → ui → effects` 顺序渲染，并可单独关闭图层。
- 手机竖屏优先：短边采用 390 逻辑单位；横屏时保持相同短边基准并扩展逻辑宽度。
- Canvas 的 CSS 尺寸、实际像素尺寸、逻辑尺寸与 `devicePixelRatio` 分开处理。
- 使用 Pointer Events 统一鼠标、点击、触摸和拖拽，事件包含 `pointerId`、`pointerType`、坐标、增量与总拖拽量。
- 提供暂停、恢复、销毁、场景切换和图层控制接口。
- 使用矩形、文字、占位色块、扫描线和拖拽轨迹作为测试内容。
- 提供屏幕内调试面板、快捷键和控制台 API。
- `ProgramBBridge` 只提供状态容器和事件通道，不包含程序 B 游戏规则。
- 桌面和显示器素材统一由 `ProgramAAssetManifest.ts` 管理；源素材中的历史目录名 `monotor` 只保留在 manifest 内，业务代码使用规范化语义 key。
- 背景、CRT、摄像头、文件堆、托盘、报纸、桌面壁纸和 App 图标加载失败时均有 Canvas 占位绘制；调试快照同时返回 `loadedKeys` / `failedKeys`。
- 主要移动端关闭/返回热区至少为 44×44 逻辑像素，视觉按钮尺寸保持不变。

## 当前玩家流程与 Day1 调试场景

当前玩家可达路径为：

```text
desk (monitor-room)
└─ monitor-desktop
   ├─ data-processing
   ├─ buyer-trade
   └─ risk-record
```

- `data-processing`、`buyer-trade`、`risk-record` 是 `monitor-desktop` 内部 App 视图，不会跳转到同名或相近的旧占位场景。
- 关闭任一 App 只返回 `monitor-desktop`；关闭显示器只返回 `monitor-room`。
- 旧 Day1 占位场景文件和状态机注册均保留，以便继续验证通用场景生命周期、图层和输入框架。
- 普通玩家交互不会进入 `workbench`、`buyer-exchange`、`risk-panel`、`news`、`mini-game` 或 `ending`。

## 代码职责

- `scenes`：场景生命周期、输入分发、命中测试、视图切换和命令调用；不判断业务结果。
- `views`：根据 `VisibleGameState` 和本地交互状态进行纯 Canvas 绘制。
- `render`：统一图层顺序、Canvas 帧渲染和素材失败占位。
- `core/InputManager.ts`：把鼠标、触摸和手写笔统一为 Pointer Events，保留 `pointerId` 并区分点击与拖拽。
- `game`：定义 A/B 端口、A 可见状态、mock bridge 和游戏事件。
- `assets`：集中素材 URL、加载状态和释放行为；场景不再散写素材路径。

## 程序 A / B / C 接口边界

- 程序 A：只负责 Canvas 显示、Pointer 交互、本地 `hover/selected/dragging/disabled/highlight` 状态，以及调用 `GameCommandPort`。
- 程序 B：未来负责完整游戏状态和所有配方、匹配、交易、收益、消耗、风险等规则；通过 `VisibleGameState` 向 A 提供可见数据，并通过 `packageCreated`、`transactionSuccess`、`riskChanged` 等事件返回结果。当前 command handler 只是可替换的本地 mock。
- 程序 C：运行时可通过 `CAdapter` 注入音频与内容调试仓库；正式音效只经过统一事件名，正式内容仍先由 B 整理进 `VisibleGameState`，A 不直接读取 C 的内部业务数据。

## 调试与验收

页面右上角 Debug 面板可以：

- 从下拉框切换全部八个注册场景；旧占位项会标记为 `Day1 debug only`。
- 分别开关五个渲染层。
- 暂停和恢复动画循环。
- 查看帧号、FPS、CSS 尺寸、实际像素尺寸、DPR、逻辑尺寸和方向。
- 查看最近一次 Pointer 事件、`pointerId`、输入类型、坐标和拖拽量。
- 查看当前 scene、monitor view、`currentApp`、selected IDs、三个槽位、素材成功/失败数量。

快捷键：

- `1`、`2`：调试切换现实桌面和显示器主页。
- `3` 到 `8`：只用于调试切换 Day1 旧占位场景。
- `H`：显示或隐藏现实桌面、电脑主页及 App 页面交互热区。
- `Esc`：关闭桌面查看层，或从 `monitor-desktop` 返回现实工位。
- `Space`：暂停或恢复。

控制台 API：

```ts
window.programA.getSnapshot();
window.programA.switchScene("monitor-desktop"); // 只接受玩家壳场景
window.programA.setLayerVisible("effects", false);
window.programA.setDeskHitAreasVisible(true);
window.programA.submitCardToOperationPad("RAW-001");
window.programA.placeCardToSlot("RAW-003", 2);
window.programA.removeCardFromSlot(2);
window.programA.createPackage();
window.programA.selectPackage("PKG-001");
window.programA.selectBuyer("BUYER-ALPHA");
window.programA.submitTransaction("PKG-001", "BUYER-ALPHA");
window.programA.closeMonitor();
window.programA.pause();
window.programA.resume();
window.programA.destroy();
```

程序 B 预留接口：

```ts
window.programA.programB.getState();
window.programA.programB.getVisibleState();
window.programA.programB.patchState({
  phase: "example-only",
  flags: { sampleFlag: true },
  counters: { sampleCounter: 1 },
  data: { samplePayload: "Program B can store future data here." },
});

const stop = window.programA.programB.onEvent((event) => {
  console.log(event);
});

window.programA.programB.emit("program-b:example", { value: 1 });
stop();
```

建议验收步骤：

1. 打开页面，确认 Canvas 中有持续闪烁的状态点，调试面板帧号持续增加。
2. 使用 Debug 下拉框或数字键依次切换八个注册场景，确认旧占位场景仍可用于框架调试。
3. 逐个关闭五个图层，确认对应内容消失，再重新开启。
4. 调整浏览器宽高或旋转手机，确认 `orientation`、CSS/像素/逻辑尺寸更新，内容仍在画布内。
5. 在画布中点击和拖拽，确认出现指针标记与轨迹，调试面板显示 `click`、`drag-start`、`drag-move`、`drag-end` 和正确 `pointerId`。
6. 暂停后确认帧号停止；恢复后继续增加。
7. 打开浏览器控制台，确认没有明显错误。

## 显示器电脑主页

`monitor-desktop` 使用蓝天草地复古壁纸，并且只提供三个 App 入口：`data-processing`、`buyer-trade`、`risk-record`。图标路径统一由 asset manifest 管理，点击热区比 64×64 视觉图标更大。

- “数据处理”打开“数据封装工具”：最多显示 6 张 `rawCards`。短按选择数据卡，拖过 5 逻辑像素后可将卡片放入 3 个槽位并调用 `placeCardToSlot(cardId, slotIndex)`；点击已占用槽位调用 `removeCardFromSlot(slotIndex)`；封装按钮首次调用 `createPackage()`。若 B 返回多个候选，页内弹层展示最多 3 个配方，点击后再次调用 `createPackage(preferredRecipeId)`。
- 数据处理页响应 `packageCreated` / `wasteCreated` / `packageWasted` / `packageChoiceRequired` 事件显示反馈，最多显示 4 个 `processedPackages`。配方有效性、消耗和生成规则不在程序 A 中判断。
- “买家交易”显示最多 4 个可出售 `processedPackages` 和最多 3 个 `buyers`。点击项目分别调用 `selectPackage(packageId)` / `selectBuyer(buyerId)` 并更新 `selectedPackageId -> selectedBuyerId` 预览；出售按钮调用 `submitTransaction(packageId, buyerId)`。
- 买家交易页响应 `transactionSuccess` / `transactionFailed` / `riskChanged`；“风险记录”只读展示 `riskStatus`、`lastTransactionResult`、`riskLogs` 和后果摘要，并对 `riskChanged` 显示短暂提示，不提供封装或出售操作。
- 三页动态内容均读取 mock `visibleState`；ID、状态和数量不写死在 Canvas 页面中。Program A 只维护 `selected / hover / dragging / disabled / highlight` 视图状态，业务结果由 GameCommandPort 的 mock adapter 回写或发出事件。
- 每个 App 右上角关闭按钮返回电脑主页；任务栏“返回工位”、`Esc` 或 `window.programA.closeMonitor()` 可返回现实桌面。
- 调试面板和 `window.programA.getSnapshot().monitorDesktop` 显示当前 `view`、`currentApp`、素材状态及交互热区；按 `H` 可在 Canvas 上显示热区框。

Day2 第二段交互状态补充：

- `rawCards` 的禁用状态读取 `VisibleDataCard.disabled`；Program A 只负责绘制与阻止交互，不推导业务禁用规则。当前 mock 将一张卡标记为 disabled，便于验收。
- 卡片、槽位、数据包、买家和操作按钮统一显示 `hover / pressed / dragging / selected / disabled / highlight / filled` 中适用的状态。小型视觉控件的实际热区会扩展到至少 44×44 逻辑像素，视觉尺寸保持不变。
- mock 封装门槛要求三个可见槽位各有一张且 `cardId` 不重复；同一卡片重新放入其他槽位时会先从旧槽位移除。mock 出售门槛仅检查 package 与 buyer 是否均已选择。真实配方、匹配、消耗、收益和风险规则仍由程序 B 接管。
- mock 交易结果会更新 `lastTransactionResult`、追加一条 `riskLogs`，并通过 `riskChanged` 触发风险页的短暂高亮。调试面板明确显示 `currentView`、`currentApp`、selected IDs、`slotCardIds` 和 `lastEvent`。

电脑主页验收：

1. 从现实桌面点击 CRT 屏幕，确认进入蓝天草地电脑主页。
2. 按 `H`，确认三个 App 入口和“返回工位”按钮显示热区，图标热区大于视觉图标。
3. 在数据处理页短按一张卡确认选择描边；把卡拖入任一槽位，确认 `placeCardToSlot` 日志；点击槽位确认 `removeCardFromSlot` 日志；点击封装确认 `createPackage` 日志和反馈。若 B 返回 `AMBIGUOUS_COMBINATION`，确认配方弹层可点击，并在第二次调用中回传所选 `preferredRecipeId`。
4. 在买家交易页分别选择数据包和买家，确认匹配预览及调试状态更新；点击出售确认 `submitTransaction` 日志和交易/风险反馈。
5. 打开风险记录页，确认风险状态、日志、最近交易和 `riskChanged` 提示只读显示。
6. 在每个 App 点击右上角关闭按钮返回图标桌面，再点击“返回工位”返回现实桌面。
7. 确认没有 Settings、新闻、任务、浏览器、文件夹等额外 App，控制台没有明显错误。

可通过调试状态指定下一次 mock 返回，用于分别验收失败反馈；这只是本地 command handler 配置，不是程序 B 规则：

```ts
window.programA.programB.patchState({
  data: {
    mockPackageOutcome: "packageWasted",
    mockTransactionOutcome: "transactionFailed",
    mockRiskStatus: "warning",
  },
});
```

仍待程序 B 队友替换的 mock 边界：

- `submitCardToOperationPad(cardId)`：当前只回写托盘中的 `cardId` 并发出递交事件。
- `placeCardToSlot(cardId, slotIndex)` / `removeCardFromSlot(slotIndex)`：当前只更新三个可见槽位。
- `createPackage(preferredRecipeId?)`：当前按调试开关返回 `packageCreated` / `packageWasted`，不判断配方或消耗。
- `selectPackage(packageId)` / `selectBuyer(buyerId)`：当前只回写选择状态，不做匹配判断。
- `submitTransaction(packageId, buyerId)`：当前按调试开关返回交易及风险事件，不计算收益、库存或真实风险。
- 接入程序 B 时保留 `VisibleGameState`、`GameCommandPort` 与事件通道，替换本地 mock handler 即可；程序 A 不读取程序 B 的完整内部状态。

## 现实工位桌面主场景

本阶段在 `monitor-room` 中完成现实工位桌面层，布局以 390×844 为设计基准，所有核心坐标集中在 `src/scenes/desk/DeskSceneConfig.ts`。

已完成：

- 使用 `public/assets/program-a/desk` 中的背景、CRT、文件堆、托盘、报纸、蓝天桌面和摄像头熄灯素材。
- 显示器屏幕、待处理文件堆、A4 比例数据文件、操作托盘和报纸统一使用 `hitArea / clickable / draggable / acceptsDrop / zIndex` 结构。
- 点击 CRT 屏幕进入 `monitor-desktop`；该页面展示桌面壁纸、三个 App 入口及对应 UI 骨架，不包含复杂业务规则。
- 点击报纸打开以整张报纸为主体的查看层，头版标题、摘要和日期来自 `visibleState.yesterdayNews`；关闭按钮保持轻量，不新增新闻 App。
- 短按桌面数据文件打开完整信息层，编号、标题、摘要和敏感级别从 `visibleState.rawCards` 对应 `cardId` 读取；空字段显示占位文案。点击关闭按钮、遮罩或按 `Esc` 可返回桌面。
- `visibleState.rawCards` 在现实桌面绘制为 72×102 的纵向纸质文件，并使用纸张折角、页边、印刷线和轻微错位表现文件堆；移动达到输入层的 5 逻辑像素阈值后才进入拖拽，拖到右侧托盘后仍调用 `submitCardToOperationPad(cardId)`，不在程序 A 内实现处理规则。
- 报纸同样使用点击/拖拽阈值：短按打开昨日新闻，越过阈值后跟随指针移动，松开后位置保存在当前 `MonitorRoomScene` 的本地状态中。
- 摄像头使用熄灯 PNG；红灯由 Canvas 代码绘制，并通过 `elapsedTime` 每 2 秒切换亮灭。位置、半径、模糊和亮度均在配置中可调。
- CRT 后处理集中在 `src/render/CRTEffect.ts`。现实桌面先在独立的显示器缓冲区内完成壁纸、扫描线、点阵、色散、泛光、暗角、弧面和低透明噪声，再严格裁剪回 `screenRect`；桌面、文件、报纸和托盘不会经过 CRT 后处理。`monitor-desktop` / App 可使用较明显但降低强度的整机屏幕配置，交互热区始终保持在稳定设计坐标中。`crtEnabled`、`scanlineOpacity`、`dotMatrixOpacity`、`chromaticOffset`、`glowStrength`、`jitterStrength`、`flickerStrength`、`vignetteStrength` 均集中管理，其中现实桌面的 `jitterStrength` 与 `flickerStrength` 使用更低的独立配置。
- 调试面板或 `H` 可显示所有现实桌面热区；`window.programA.getSnapshot().desk` 可读取素材、拖拽、报纸、监控灯和交互项状态。

现实桌面验收：

1. 折叠右上角 Debug 面板，确认整体布局与参考图一致：摄像头在墙面上方、CRT 居中、文件在左、托盘在右、报纸在左下。
2. 按 `H`，确认显示器、文件堆、每张桌面数据文件、托盘和报纸出现可区分的热区框。
3. 点击 CRT 屏幕，确认进入 `monitor-desktop`；按 `Esc` 或点击“返回工位”返回。
4. 确认桌面数据文件为接近 A4 比例的纵向纸页；短按后完整信息层读取对应 `rawCards` 数据。
5. 把同一数据文件拖到右侧托盘，确认没有打开详情层，页面显示“已递交”且控制台输出 `submitCardToOperationPad(cardId)`。
6. 短按报纸，确认查看层是一张完整报纸且突出动态昨日新闻标题；关闭后拖动报纸，确认它跟随指针并在松开后停留。
7. 对比现实桌面其他物品与显示器屏幕，确认 CRT 效果只覆盖屏幕；进入电脑主页及 App 后确认扫描线、点阵、色散、泛光、暗角和轻微漂移可见但文字仍可读、图标仍可点。
8. 观察摄像头红灯至少 4 秒，确认每 2 秒亮/灭切换一次。

## 完整验收清单

- [ ] 现实桌面、摄像头、显示器、文件堆、托盘和报纸正常显示。
- [ ] 点击显示器进入电脑主页，三个且仅三个 App 图标均可打开。
- [ ] 每个 App 的右上角关闭按钮可返回电脑主页，任务栏按钮可返回现实桌面。
- [ ] 数据卡支持短按选择、鼠标/触摸拖入槽位、点击槽位移除；封装按钮产生 command 日志和 mock 反馈。
- [ ] 买家交易可选择数据包和买家、更新匹配预览；出售按钮产生 command 日志和 mock 反馈。
- [ ] 风险记录只读展示风险、日志、最近交易和 `riskChanged` 提示。
- [ ] 报纸支持短按放大、遮罩/按钮关闭和拖动后停留。
- [ ] 桌面数据文件呈 A4 纵向纸张形象；报纸放大层以报纸本体和动态昨日新闻标题为视觉主体。
- [ ] CRT 效果只覆盖显示器内容，电脑主页和 App 保持可读、可点击、可拖拽。
- [ ] 390×844 手机竖屏布局完整；横屏使用等比缩放和居中留边，不崩溃、不发生坐标漂移。
- [ ] 开启 `H` 后能看到热区和 scene/view/App/selected/pointer 调试信息。
- [ ] 素材请求失败时显示占位绘制，`failedKeys` 能指出失败资源。
- [ ] `npm run build` 通过，浏览器控制台无明显错误。

## 本阶段不包含

- 数据处理 App、买家交易 App、风险记录 App 的配方、匹配、收益、消耗和风险计算规则。
- 新增音效、完整内容系统或正式业务规则。
- 完整关卡、任务、经济、风险、新闻、结局或小游戏规则。
- 内容系统、存档、后端、联网与数据持久化。

## Day 1 - Day 7 每日主线壳

程序 A 已提供可替换的每日流程显示与交互壳，正式题目、判定、数值和文本仍由程序 B/C 提供。

```text
Day 1: 简报 -> 小关卡 -> 数据处理 -> 买家交易 -> 每日独白
Day 2-6: 昨日新闻 -> 情绪选择 -> 简报 -> 小关卡 -> 数据处理 -> 买家交易 -> 每日独白
Day 7: 昨日新闻 -> 早间简报 -> 情绪选择 -> 最终小关卡 -> 数据处理 -> 买家交易 -> 每日独白 -> 结局
```

- 新闻只通过现实工位的报纸阅读，不新增新闻 App。
- Day 1、2、3、4、6、7 的小关卡在数据处理 App 内显示；Day 5 三轮谈判在买家交易 App 内显示。
- 模拟数据遵循卡片流入数量：Day 1 为 5 张，Day 2-6 为 8 张，Day 7 为 1 张员工档案；每日买家模拟为 3-5 个。
- 风险记录 App 只读展示当前风险、最近交易、风险日志、后果摘要，以及操作/新闻/黑箱/独白四类档案。
- `MockBAdapter` 只用于前端联调。接入正式程序 B 后，保留 `VisibleGameState`、`GameCommandPort` 和事件通道，替换 mock adapter 即可。

### 快速跳转每日流程

以下接口只在本地 `MockBAdapter` 下生效，用来直接验收后期天数，不属于程序 B 正式命令：

```ts
window.programA.programB.setMockDay(2, "news");
window.programA.programB.setMockDay(5, "challenge");
window.programA.programB.setMockDay(7, "news");
window.programA.programB.getVisibleState().dailyFlow;
```

默认阶段为 Day 1 的 `briefing`，以及 Day 2-7 的 `news`。正式程序 B 接入后的流程顺序应保持：Day 2-6 为 `news -> emotion -> briefing -> challenge -> processing -> trading -> monologue`，Day 7 为 `news -> briefing -> emotion -> challenge -> processing -> trading -> monologue -> ending`。

完整 mock 冒烟验收脚本位于 `scripts/mainline-smoke.cjs`。它是开发/CI 工具，需要执行环境已经提供 Playwright，不属于项目运行依赖；普通人工验收无需安装 Playwright。具备该环境时可执行：

```powershell
$env:PROGRAM_A_URL = "http://127.0.0.1:5173/"
node scripts/mainline-smoke.cjs
```

脚本会检查 Day2、Day7 的阶段顺序、情绪数值、卡片数量、封装、交易、结局和横竖屏 Canvas，并把截图写入 `artifacts/mainline-smoke/`。Day7 mock 封装按最新文本配置只需要 1 张员工档案；其他天继续使用 3 张不重复卡片验证三槽位。
