# Program C 开发包

本目录是程序 C 的本地开发包，负责内容工具、音效、构建与性能检查。

## 当前完成

- D1：本地工具链、内容校验、离线清单、包体检查、Web Audio 音频管理器框架。
- D2：10 套数据卡牌、20 个用户画像、变量填充系统、数据流入音效、三种情绪选择音效。
- D3：10 条新闻模板、新闻与数据包类型匹配、打包封装/霓虹充能/交易封装音效事件。
- D4：新闻模板扩到 20 条，协议伪装配对扩到 20 组，新增新闻播报音效和 BGM 切换事件。
- D5：数据清洗图标配置、舆论操控话术、黑盒评价台词、通用小关卡成败音效和黑盒台词音效绑定。
- D6：Day 4 用户画像拼图碎片、Day 5 买家谈判纯叙事话术、7 天每日独白、小关卡 BGM 和独白打字机音效。

## 目录说明

- `data/`：JSON 内容库。
- `src/content/schema.ts`：内容数据类型约定。
- `src/content/ContentRepository.ts`：内容读取、变量填充、打包预览、新闻匹配、小关卡、画像拼图、谈判和每日独白读取工具。
- `src/audio/AudioManager.ts`：基于 Web Audio API 的事件音效和 BGM 管理器。
- `src/audio/soundMap.ts`：程序 A / B 可调用的事件名到音效 ID 的映射。
- `scripts/validate-content.mjs`：JSON 内容校验。
- `scripts/bundle-size-report.mjs`：8MB 包体预算检查。
- `docs/audio-preview.html`：本地音效试听页。

## 本地检查

```bash
npm run check
```

## 给队友的接入口

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage("precise_profile");
const day2Challenge = content.findChallengeByDay(2);
const opinion = content.pickPublicOpinionScript("precise_profile");
const blackBoxLine = content.pickBlackBoxLine("challenge_success", { day: 2 });
const day4Puzzle = content.pickProfilePuzzleByDay(4);
const day5Negotiation = content.pickBuyerNegotiationScript("precise_profile");
const day5Monologue = content.findDailyMonologueByDay(5);

audio.handleGameEvent("newsBroadcast");
audio.handleGameEvent("challengeSuccess");
audio.handleGameEvent("challengeBgm");
audio.handleGameEvent("monologueType");
audio.handleGameEvent("bgmPressure");
```

更完整的交接说明见 `docs/program-c-integration.md`。
