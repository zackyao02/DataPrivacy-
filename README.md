# 程序 A：H5 Canvas 2D 基础框架（Day1）

这是程序 A 的 Day1 技术骨架。项目使用轻量的 TypeScript + Vite，不包含 UI 框架、正式视觉、美术资源、音效或程序 B 的游戏规则。

## 启动

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
   ├─ debug
   │  └─ DebugPanel.ts          # 场景、图层、循环、输入验收面板
   ├─ game
   │  └─ ProgramBBridge.ts      # 预留给程序 B 的状态和事件接口
   ├─ render
   │  └─ LayerRenderer.ts       # 五层顺序渲染及图层开关
   ├─ scenes
   │  ├─ PlaceholderScene.ts    # 矩形、文字、色块测试内容
   │  ├─ Scene.ts               # 场景协议
   │  └─ SceneManager.ts        # 场景状态机与切换
   ├─ main.ts
   └─ styles.css
```

## Day1 已完成

- 初始化 `CanvasRenderingContext2D`。
- 使用 `requestAnimationFrame` 驱动动画循环。
- `update(deltaTime)` 与 `render()` 分离，`deltaTime` 使用秒并限制最大值，避免切回标签页时跳帧过大。
- 预留并可切换七个场景：
  - `monitor-room`
  - `workbench`
  - `buyer-exchange`
  - `risk-panel`
  - `news`
  - `mini-game`
  - `ending`
- 固定按 `background → devices → cards → ui → effects` 顺序渲染，并可单独关闭图层。
- 手机竖屏优先：短边采用 390 逻辑单位；横屏时保持相同短边基准并扩展逻辑宽度。
- Canvas 的 CSS 尺寸、实际像素尺寸、逻辑尺寸与 `devicePixelRatio` 分开处理。
- 使用 Pointer Events 统一鼠标、点击、触摸和拖拽，事件包含 `pointerId`、`pointerType`、坐标、增量与总拖拽量。
- 提供暂停、恢复、销毁、场景切换和图层控制接口。
- 使用矩形、文字、占位色块、扫描线和拖拽轨迹作为测试内容。
- 提供屏幕内调试面板、快捷键和控制台 API。
- `ProgramBBridge` 只提供状态容器和事件通道，不包含程序 B 游戏规则。

## 调试与验收

页面右上角 `Day1 Debug` 面板可以：

- 从下拉框切换七个场景。
- 分别开关五个渲染层。
- 暂停和恢复动画循环。
- 查看帧号、FPS、CSS 尺寸、实际像素尺寸、DPR、逻辑尺寸和方向。
- 查看最近一次 Pointer 事件、`pointerId`、输入类型、坐标和拖拽量。

快捷键：

- `1` 到 `7`：按列表顺序切换场景。
- `Space`：暂停或恢复。

控制台 API：

```ts
window.programA.getSnapshot();
window.programA.switchScene("news");
window.programA.setLayerVisible("effects", false);
window.programA.pause();
window.programA.resume();
window.programA.destroy();
```

程序 B 预留接口：

```ts
window.programA.programB.getState();
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
2. 依次切换七个场景，确认标题和占位配色变化。
3. 逐个关闭五个图层，确认对应内容消失，再重新开启。
4. 调整浏览器宽高或旋转手机，确认 `orientation`、CSS/像素/逻辑尺寸更新，内容仍在画布内。
5. 在画布中点击和拖拽，确认出现指针标记与轨迹，调试面板显示 `click`、`drag-start`、`drag-move`、`drag-end` 和正确 `pointerId`。
6. 暂停后确认帧号停止；恢复后继续增加。
7. 打开浏览器控制台，确认没有明显错误。

## 本阶段不包含

- 正式视觉规范和最终 UI。
- 像素画、美术资源、动画资源和音效。
- 完整关卡、任务、经济、风险、新闻、结局或小游戏规则。
- 内容系统、存档、后端、联网与数据持久化。
