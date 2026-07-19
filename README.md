# 程序 A：H5 Canvas 2D Day1–Day2

项目使用轻量的 TypeScript + Vite 和原生 Canvas 2D，不包含 UI 框架，也不在程序 A 中实现程序 B 的游戏规则。目前包含现实工位、显示器电脑主页和三个 App 的显示/交互层。

## Day2：完整显示器 mock 流程

- 现实桌面已接入显示器、报纸、文件与托盘热区；文件递交会调用 `submitCardToOperationPad(cardId)`，并由本地 mock adapter 回写 `visibleState.operationPadCardId`。
- 显示器主页仅保留数据处理、买家交易、风险记录三个入口；三个 App 均可关闭回主页，再返回现实桌面。
- mock `VisibleGameState` 提供 6 张 `rawCards`、3 个 `workbench.slotCardIds`、初始 3 个 `processedPackages` 和 3 个 `buyers`。封装成功会补入第 4 个 mock 数据包，以便从桌面到交易页完整验证显示状态流。
- 所有操作统一经过 `GameCommandPort`，在控制台打印 command，并由本地 mock handler 更新可见状态或发出反馈事件；没有实现配方、消耗、买家匹配、收益或风险计算规则。
- Pointer Events、点击/拖拽阈值、`selected / hover / dragging / disabled / highlight` 状态、竖屏优先适配和横屏基础兼容沿用现有 Canvas 框架。

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
   ├─ debug
   │  └─ DebugPanel.ts          # 场景、图层、循环、输入验收面板
   ├─ game
   │  ├─ GamePorts.ts           # 程序 A → B 的命令接口
   │  ├─ ProgramBBridge.ts      # 预留给程序 B 的状态和事件接口
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
- 程序 C：当前未接入；未来素材、内容或音频能力应通过约定端口/统一事件接入，不直接修改程序 A 场景，也不让 A 直接读取 C 的内部数据。

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

- “数据处理”打开“数据封装工具”：最多显示 6 张 `rawCards`。短按选择数据卡，拖过 5 逻辑像素后可将卡片放入 3 个槽位并调用 `placeCardToSlot(cardId, slotIndex)`；点击已占用槽位调用 `removeCardFromSlot(slotIndex)`；封装按钮调用 `createPackage(preferredRecipeId?)`。
- 数据处理页响应 `packageCreated` / `packageWasted` mock 事件显示轻量反馈，最多显示 4 个 `processedPackages`。配方有效性、消耗和生成规则不在程序 A 中判断。
- “买家交易”显示最多 4 个可出售 `processedPackages` 和最多 3 个 `buyers`。点击项目分别调用 `selectPackage(packageId)` / `selectBuyer(buyerId)` 并更新 `selectedPackageId -> selectedBuyerId` 预览；出售按钮调用 `submitTransaction(packageId, buyerId)`。
- 买家交易页响应 `transactionSuccess` / `transactionFailed` / `riskChanged`；“风险记录”只读展示 `riskStatus`、`lastTransactionResult`、`riskLogs` 和后果摘要，并对 `riskChanged` 显示短暂提示，不提供封装或出售操作。
- 三页动态内容均读取 mock `visibleState`；ID、状态和数量不写死在 Canvas 页面中。Program A 只维护 `selected / hover / dragging / disabled / highlight` 视图状态，业务结果由 GameCommandPort 的 mock adapter 回写或发出事件。
- 每个 App 右上角关闭按钮返回电脑主页；任务栏“返回工位”、`Esc` 或 `window.programA.closeMonitor()` 可返回现实桌面。
- 调试面板和 `window.programA.getSnapshot().monitorDesktop` 显示当前 `view`、`currentApp`、素材状态及交互热区；按 `H` 可在 Canvas 上显示热区框。

Day2 第二段交互状态补充：

- `rawCards` 的禁用状态读取 `VisibleDataCard.disabled`；Program A 只负责绘制与阻止交互，不推导业务禁用规则。当前 mock 将一张卡标记为 disabled，便于验收。
- 卡片、槽位、数据包、买家和操作按钮统一显示 `hover / pressed / dragging / selected / disabled / highlight / filled` 中适用的状态。小型视觉控件的实际热区会扩展到至少 44×44 逻辑像素，视觉尺寸保持不变。
- mock 封装门槛仅检查三个可见槽位中是否至少有一张卡；mock 出售门槛仅检查 package 与 buyer 是否均已选择。真实配方、匹配、消耗、收益和风险规则仍由程序 B 接管。
- mock 交易结果会更新 `lastTransactionResult`、追加一条 `riskLogs`，并通过 `riskChanged` 触发风险页的短暂高亮。调试面板明确显示 `currentView`、`currentApp`、selected IDs、`slotCardIds` 和 `lastEvent`。

电脑主页验收：

1. 从现实桌面点击 CRT 屏幕，确认进入蓝天草地电脑主页。
2. 按 `H`，确认三个 App 入口和“返回工位”按钮显示热区，图标热区大于视觉图标。
3. 在数据处理页短按一张卡确认选择描边；把卡拖入任一槽位，确认 `placeCardToSlot` 日志；点击槽位确认 `removeCardFromSlot` 日志；点击封装确认 `createPackage` 日志和反馈。
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
