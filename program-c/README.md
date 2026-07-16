# Program C 开发包

本目录是程序 C 的本地开发包，内容按团队分工表整理：内容工具、音效、构建与性能。

> 说明：这里的 D1 / D2 / D3 指团队分工表里的开发日安排，不是游戏剧情里的 Day 1 / Day 2 / Day 3。

## 当前完成

- 分工表 D1：本地工具链、内容校验、离线清单、包体检查、Web Audio 音频管理器框架。
- 分工表 D2：10 套数据卡片、20 个用户画像、变量填充系统、数据流入音效、三种情绪选择音效。
- 分工表 D3：10 条新闻模板、新闻与数据包类型匹配方法、打包封装/霓虹充能/交易封装音效事件。
- 游戏内小关卡内容目前只包含 Day 1「协议伪装」和 Day 2「数据清洗」；没有误把分工表 D3 当成游戏 Day 3 上传。

## 目录说明

- `data/`：JSON 内容库。
- `src/content/schema.ts`：内容数据类型约定。
- `src/content/ContentRepository.ts`：内容读取、变量填充、打包预览、新闻匹配、每日关卡读取工具。
- `src/audio/AudioManager.ts`：基于 Web Audio API 的事件音效管理器。
- `src/audio/soundMap.ts`：程序 A / B 可调用的事件名到音效 ID 的映射。
- `scripts/validate-content.mjs`：JSON 内容校验。
- `scripts/bundle-size-report.mjs`：8MB 包体预算检查。

## 本地检查

```bash
cmd /c npm run check
```

当前检查通过：cards=10，users=20，news=10，dayChallenges=2，raw=45916 bytes，gzip=15945 bytes。

## 给队友的接入口

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage("精准画像包");
const day2Challenge = content.findChallengeByDay(2);
```

推荐音效事件见 `docs/program-c-integration.md`。
