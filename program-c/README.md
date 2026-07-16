# Program C 开发包

本目录是程序 C 的本地开发包，负责内容工具、音效、构建与性能检查。

## 当前完成

- 分工表 D1：本地工具链、内容校验、离线清单、包体检查、Web Audio 音频管理器框架。
- 分工表 D2：10 套数据卡片、20 个用户画像、变量填充系统、数据流入音效、三种情绪选择音效。
- 分工表 D3：10 条新闻模板、新闻与数据包类型匹配、打包封装/霓虹充能/交易封装音效事件。
- 分工表 D4：新闻模板扩到 20 条、协议伪装配对扩到 20 组、新闻播报音效、BGM 切换事件。

## 目录说明

- `data/`：JSON 内容库。
- `src/content/schema.ts`：内容数据类型约定。
- `src/content/ContentRepository.ts`：内容读取、变量填充、打包预览、新闻匹配、小关卡读取工具。
- `src/audio/AudioManager.ts`：基于 Web Audio API 的事件音效和 BGM 管理器。
- `src/audio/soundMap.ts`：程序 A / B 可调用的事件名到音效 ID 的映射。
- `scripts/validate-content.mjs`：JSON 内容校验。
- `scripts/bundle-size-report.mjs`：8MB 包体预算检查。

## 本地检查

```bash
cmd /c npm run check
```

## 给队友的接入口

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage("精准画像包");
const day2Challenge = content.findChallengeByDay(2);

audio.handleGameEvent("newsBroadcast");
audio.handleGameEvent("bgmPressure");
```

更完整的交接说明见 `docs/program-c-integration.md`。
