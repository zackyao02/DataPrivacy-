# Program C 开发包

本目录是程序 C 的本地开发包，负责内容工具、音效、构建与性能检查。

## 当前完成

- D1：本地工具链、内容校验、离线清单、包体检查、Web Audio 音频管理器框架。
- D2：初版数据卡牌、20 个用户画像、变量填充系统、数据流入音效、三种情绪选择音效。
- D3：10 条新闻模板、新闻与数据包类型匹配、打包封装/霓虹充能/交易封装音效事件。
- D4：新闻模板扩到 20 条，协议伪装配对扩到 20 组，新增新闻播报音效和 BGM 切换事件。
- D5：数据清洗图标配置、舆论操控话术、黑盒评价台词、通用小关卡成败音效和黑盒台词音效绑定。
- D6：Day 4 用户画像拼图碎片、Day 5 买家谈判纯叙事话术、7 天每日独白、小关卡 BGM 和独白打字机音效。
- D7：Week 1 垂直切片内容整合验收、音效整合检查、性能初测报告和工具链文档。
- 架构审查修复：补充 Program C TypeScript 验收、严格打包预览契约、未知音效事件提示、主应用调试入口接入。
- D7 后联调：主应用 `workbench`、`news`、`mini-game` 已接入 Program C 内容与音效，支持卡槽打包、新闻反馈、情绪选择和小关卡入口。
- D8：小关卡已接入内容驱动点击规则，支持 Day 1 协议伪装、Day 2 数据清洗、Day 3 舆论操控、Day 4 画像拼图、Day 5 买家谈判、Day 6 快速协议扫描，并补充清醒值驱动的结局分支原型。
- D9：接入 Day 7 证据链重组原型，新增证据链模板、18 件证据、3 条关键连接、低清醒值“最后的数据包”分支展示，并把情绪选择接成真实清醒值累计。
- D7 内容对齐补充：根据最新飞书“文本配置”更新 Week 1 垂直切片验收前已有内容口径，升级已存在的数据卡、用户、新闻、协议词、清洗图标、舆论题、画像拼图、谈判话术、协议扫描模板、证据链模板、每日独白和黑盒台词；新增同步脚本。结局报告、分享/存档和最终 UI 文案仍作为后续开发依据。

## 目录说明

- `data/`：JSON 内容库。
- `src/content/schema.ts`：内容数据类型约定。
- `src/content/ContentRepository.ts`：内容读取、变量填充、打包预览、新闻匹配、小关卡、画像拼图、谈判、证据链和每日独白读取工具。
- `src/audio/AudioManager.ts`：基于 Web Audio API 的事件音效和 BGM 管理器。
- `src/audio/soundMap.ts`：程序 A / B 可调用的事件名到音效 ID 的映射。
- `scripts/validate-content.mjs`：JSON 内容校验。
- `scripts/sync-feishu-text-config.mjs`：从本地飞书 Markdown 快照同步文本配置到 JSON 内容库。
- `scripts/bundle-size-report.mjs`：8MB 包体预算检查。
- `scripts/week1-vertical-slice-report.mjs`：D7 垂直切片内容、音效和性能初测报告，并记录 D8/D9 Day 1-7 可玩小关卡覆盖。
- `docs/audio-preview.html`：本地音效试听页。
- `docs/program-c-delivery-index.md`：Program C D1-D9 交付索引。
- `docs/program-c-toolchain.md`：程序 C 工具链交接说明。
- `docs/program-c-acceptance-checklist.md`：Program C 验收清单。
- `docs/week1-vertical-slice-report.md`：Week 1 垂直切片验收报告。

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
const day3Challenge = content.findChallengeByDay(3);
const opinion = content.pickPublicOpinionScript("precise_profile");
const blackBoxLine = content.pickBlackBoxLine("challenge_success", { day: 2 });
const day4Puzzle = content.pickProfilePuzzleByDay(4);
const day5Negotiation = content.pickBuyerNegotiationScript("precise_profile");
const day6Protocol = content.pickProtocolScanTemplate();
const day7Evidence = content.pickEvidenceChainTemplate();
const day5Monologue = content.findDailyMonologueByDay(5);

audio.handleGameEvent("newsBroadcast");
audio.handleGameEvent("challengeSuccess");
audio.handleGameEvent("challengeBgm");
audio.handleGameEvent("monologueType");
audio.handleGameEvent("bgmPressure");
audio.handleGameEvent("endingTriggered");
```

`readyPackages` 会过滤掉未知卡、重复卡和额外卡；需要排查原因时看预览对象里的 `unknownCardIds`、`duplicateCardIds`、`extraCardIds` 和 `missingDataTypes`。`handleGameEvent` 返回 `boolean`，未知事件会返回 `false` 并在控制台提示一次。

更完整的交接说明见 `docs/program-c-integration.md`。
