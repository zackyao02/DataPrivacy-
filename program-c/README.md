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
- D10：接入结局报告与本地存档闭环，Day 7 成功后进入 `ending` 报告页，按清醒值生成“替罪羊 / 举报者”评级分支，支持分享文案复制、存档读取、自动保存和清除存档。
- D11：工作台接入真实拖拽卡槽判定，支持从卡池拖入指定槽位、槽位替换、已选卡槽交换、拖出槽位移除，同时保留点击选卡兜底。
- D12：新增 Program C 集成适配层，导出 `createProgramCIntegration()`，并让当前主应用同步挂载 `window.programAIntegrations.programC`。
- D13：新增 Program B visibleState / runtime binding 适配层，当前主应用同步挂载 `window.programAIntegrations.programB`，并用 smoke 脚本验证 Day 1 主线可推进到 Day 2。
- D14：新增根目录 Week 1 全日规则 smoke，使用 Program B runtime binding 连续验证 Day 1-7 规则、证据链和结局报告。
- D7 内容对齐补充：根据最新飞书“文本配置”更新 Week 1 垂直切片验收前已有内容口径，升级已存在的数据卡、用户、新闻、协议词、清洗图标、舆论题、画像拼图、谈判话术、协议扫描模板、证据链模板、结局报告模板、每日独白和黑盒台词；新增同步脚本。最终图片导出、二维码视觉和完整 UI 文案仍作为后续开发依据。

## 目录说明

- `data/`：JSON 内容库。
- `src/content/schema.ts`：内容数据类型约定。
- `src/content/ContentRepository.ts`：内容读取、变量填充、打包预览、新闻匹配、小关卡、画像拼图、谈判、证据链、结局报告和每日独白读取工具。
- `src/audio/AudioManager.ts`：基于 Web Audio API 的事件音效和 BGM 管理器。
- `src/audio/soundMap.ts`：程序 A / B 可调用的事件名到音效 ID 的映射。
- `src/integration/createProgramCIntegration.ts`：Program A 最新 adapter / daily flow 分支可直接挂接的 C 侧适配对象。
- `../src/game/WeekOneProgramBAdapter.ts`：当前 WeekOne 真实玩法到 Program A visibleState / runtime binding 的适配层。
- `scripts/validate-content.mjs`：JSON 内容校验。
- `scripts/validate-integration-contract.mjs`：检查 Program C 对 Program A / B 暴露的集成契约。
- `scripts/sync-feishu-text-config.mjs`：从本地飞书 Markdown 快照同步文本配置到 JSON 内容库。
- `scripts/bundle-size-report.mjs`：8MB 包体预算检查。
- `scripts/week1-vertical-slice-report.mjs`：D7 垂直切片内容、音效和性能初测报告，并记录 D8/D9 Day 1-7 可玩小关卡、D10 结局报告/存档、D11 拖拽卡槽、D12 C 适配、D13 B runtime 和 D14 全日规则 smoke 覆盖。
- `docs/audio-preview.html`：本地音效试听页。
- `docs/program-c-delivery-index.md`：Program C D1-D14 交付索引。
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
const endingReport = content.pickEndingReportTemplate();
const day5Monologue = content.findDailyMonologueByDay(5);

audio.handleGameEvent("newsBroadcast");
audio.handleGameEvent("challengeSuccess");
audio.handleGameEvent("challengeBgm");
audio.handleGameEvent("monologueType");
audio.handleGameEvent("bgmPressure");
audio.handleGameEvent("endingTriggered");
```

Program A 最新 adapter 入口也可直接使用：

```ts
import { createProgramCIntegration } from "./integration";

const programC = createProgramCIntegration();
window.programAIntegrations = {
  ...window.programAIntegrations,
  programC,
};

programC.audio.handleGameEvent("newsBroadcast");
programC.contentDebug.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});
```

当前主应用还会挂载 B runtime binding：

```ts
window.programAIntegrations.programB.getState();
window.programAIntegrations.programB.advanceDailyPhase(
  window.programAIntegrations.programB.getState(),
);
```

正式音频边界是 `audio.handleGameEvent(eventName)`；`contentDebug` 只用于联调、调试和 B 侧生成 A 可见状态时核对内容，不作为 A 侧正式业务状态来源。

`readyPackages` 会过滤掉未知卡、重复卡和额外卡；需要排查原因时看预览对象里的 `unknownCardIds`、`duplicateCardIds`、`extraCardIds` 和 `missingDataTypes`。`handleGameEvent` 返回 `boolean`，未知事件会返回 `false` 并在控制台提示一次。

更完整的交接说明见 `docs/program-c-integration.md`。
