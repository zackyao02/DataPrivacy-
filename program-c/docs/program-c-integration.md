# 程序 C 交接说明

本开发包覆盖“程序 C：内容工具与音效 / 构建与性能”。文档中未完全定稿的部分，程序 C 按主线方向和联调需要做了小范围优化。

## 分工表进度

| 开发日 | 程序 C 任务 | 当前状态 |
| --- | --- | --- |
| D1 | 工具链、音频框架、性能/离线检查基础 | 已完成 |
| D2 | 初版卡牌、20 个用户画像、变量填充、数据流入音效、三种情绪音效 | 已完成 |
| D3 | 10 条新闻模板、新闻匹配算法、打包/交易音效 | 已完成 |
| D4 | 新闻扩到 20 条、协议伪装配对扩到 20 组、新闻播报音效、BGM 切换 | 已完成 |
| D5 | 数据清洗图标、舆论操控话术、黑盒评价台词、小关卡通用成败音效 | 已完成 |
| D6 | Day 4 画像拼图、Day 5 买家谈判纯叙事话术、7 天每日独白、小关卡 BGM、独白打字机音效 | 已完成 |
| D7 | Week 1 内容整合验收、音效整合检查、性能初测报告、工具链文档；按最新飞书文本配置对齐验收前内容口径 | 已完成 |
| D8 | Day 1 / 2 / 3 / 4 / 5 / 6 小关卡内容驱动点击规则，Day 3 舆论操控，Day 6 快速协议扫描，结局分支原型 | 已完成 |
| D9 | Day 7 证据链重组原型、低清醒值最后数据包分支展示、情绪驱动清醒值累计 | 已完成 |
| D10 | 结局报告模板、`ending` 报告场景、分享文案复制、本地存档读取/保存/清除 | 已完成 |
| D11 | `workbench` 拖拽卡槽判定、槽位替换、已选卡交换、拖出移除、点击兜底 | 已完成 |
| D12 | Program C 集成适配层、`window.programAIntegrations.programC` registry、集成契约校验 | 已完成 |
| D13 | Program B visibleState / runtime binding、`window.programAIntegrations.programB` registry、Day 1 -> Day 2 smoke | 已完成 |
| D14 | Week 1 全日规则 smoke，覆盖 Day 1-7 runtime 命令、证据链和结局报告 | 已完成 |

## 内容文件

| 文件 | 用途 |
| --- | --- |
| `data/card_templates.json` | 20 套正式数据卡模板 |
| `data/users.json` | 20 个用户画像 |
| `data/buyers.json` | 15 个买家和可接受的数据包类型 |
| `data/variables.json` | `{姓名}`、`{城市}`、`{金额}`、`{平台}`、`{地点}`、`{话题}`、`{商品}`、`{时长}`、`{场景}`、`{数值}` 占位符池 |
| `data/news_templates.json` | 20 条新闻模板，每种数据包类型至少 4 条 |
| `data/protocol_terms.json` | 20 组协议伪装配对 |
| `data/package_recipes.json` | 5 种数据包配方 |
| `data/day_challenges.json` | Day 1 / Day 2 / Day 3 / Day 4 / Day 5 / Day 6 / Day 7 游戏内小关卡入口配置 |
| `data/data_cleaning_icons.json` | Day 2 数据清洗图标视觉配置，18 个敏感/干扰图标 |
| `data/public_opinion_scripts.json` | 10 组 Day 3 舆论操控话术模板，小关卡会从 3 个话术里判定唯一安全改写 |
| `data/profile_puzzles.json` | 3 组 Day 4 用户画像拼图碎片 |
| `data/buyer_negotiation_scripts.json` | 6 组 Day 5 买家谈判话术；纯叙事，无价格/风险联动字段 |
| `data/protocol_scan_templates.json` | 5 套 Day 6 快速协议扫描模板 |
| `data/evidence_chain_templates.json` | 1 套 Day 7 证据链模板，包含18件证据、3条连接和最后数据包分支 |
| `data/ending_report_templates.json` | 1 套结局报告模板，包含替罪羊 / 举报者评级分支、分享文案和报告字段 |
| `data/daily_monologues.json` | 7 天每日新闻后的独白文案 |
| `data/black_box_lines.json` | 71 条黑盒台词和音效绑定，包含 Day 3 小关卡反馈和 Day 7 证据链反馈 |
| `scripts/sync-feishu-text-config.mjs` | 从本地飞书 Markdown 快照同步文本配置到 JSON 内容库 |

## 程序 B 接入内容

```ts
import { createDefaultContentRepository } from "./content";

const content = createDefaultContentRepository();
const user = content.pickUser();
const card = content.pickCard("location");
const title = content.fillVariables(card.title, { user });

const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage("precise_profile");
const opinion = content.pickPublicOpinionScript("precise_profile");
const blackBoxLine = content.pickBlackBoxLine("package_review", {
  packageType: "precise_profile",
});
const profilePuzzle = content.pickProfilePuzzleByDay(4);
const negotiation = content.pickBuyerNegotiationScript("precise_profile");
const protocolScan = content.pickProtocolScanTemplate();
const evidenceChain = content.pickEvidenceChainTemplate();
const endingReport = content.pickEndingReportTemplate();
const monologue = content.findDailyMonologueByDay(5);
```

常用能力：

- `findPackagePreviews(cardIds, { onlyReady: true })`：判断当前卡槽能生成哪些包。
- `findNewsForPackage(packageType)`：读取指定包类型的新闻列表。
- `pickNewsForPackage(packageType)`：从指定包类型中随机抽一条新闻。
- `findChallengeByDay(1)`：读取 Day 1 “协议伪装”配置。
- `findChallengeByDay(2)`：读取 Day 2 “数据清洗”配置。
- `findChallengeByDay(3)`：读取 Day 3 “舆论操控”入口配置。
- `findChallengeByDay(4)`：读取 Day 4 “用户画像拼图”入口配置。
- `findChallengeByDay(5)`：读取 Day 5 “买家谈判”入口配置。
- `findChallengeByDay(6)`：读取 Day 6 “快速协议扫描”入口配置。
- `findChallengeByDay(7)`：读取 Day 7 “重组证据链”入口配置。
- `findDataCleaningIcon(iconHint)`：读取 Day 2 图标视觉配置。
- `pickPublicOpinionScript(packageType)`：按包类型抽取 Day 3 舆论操控话术；其中 `label === "安全改写"` 的选项是当前可玩规则的通关选择。
- `pickProfilePuzzleByDay(4)`：随机抽取一组画像拼图碎片。
- `pickBuyerNegotiationScript(packageType)`：按数据包类型抽取 Day 5 谈判脚本。两项选择都成交，只返回不同叙事和黑盒反馈。
- `pickProtocolScanTemplate()`：随机抽取一套 Day 6 协议扫描模板；也可用 `findProtocolScanTemplatesByIds(ids)` 对齐关卡配置。
- `pickEvidenceChainTemplate()`：读取 Day 7 证据链模板；也可用 `findEvidenceChainTemplatesByIds(ids)` 对齐关卡配置。
- `pickEndingReportTemplate()`：读取 D10 结局报告模板；也可用 `findEndingReportTemplateById(id)` 对齐指定报告配置。
- `findDailyMonologueByDay(day)`：读取指定天数新闻后的独白文案，`day` 范围 1-7。
- `pickBlackBoxLine(stage, filters)`：按阶段、天数或包类型抽取黑盒台词。

打包预览契约：

- `ready=true` 需要卡牌刚好满足配方，且没有未知卡、重复卡或额外卡。
- 如果 `onlyReady=true` 没有返回结果，B 侧可以先不结算；调试时检查 `unknownCardIds`、`duplicateCardIds`、`extraCardIds` 和 `missingDataTypes`。
- 当前工作台按 3 个槽位联调；如果 B 侧保留 4 槽位，需要先在 B 区共享文档写明兼容策略。

## 程序 A / B 接入音效

```ts
import { AudioManager } from "./audio";

const audio = new AudioManager({ masterVolume: 0.72 });

window.addEventListener("pointerdown", () => {
  void audio.unlock();
}, { once: true });

const played = audio.handleGameEvent("dataFlowIn");
audio.handleGameEvent("newsBroadcast");
audio.handleGameEvent("challengeSuccess");
audio.handleGameEvent("blackBoxLine");
audio.handleGameEvent("challengeBgm");
audio.handleGameEvent("monologueType");
audio.handleGameEvent("bgmPressure");
```

`handleGameEvent` 返回 `boolean`：事件名命中时返回 `true`，未知事件返回 `false` 并在调试控制台提示一次。

主应用调试入口：

```ts
window.programA.programC.content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});
window.programA.programC.audio.handleGameEvent("challengeBgm");
window.programA.programB.emit("challengeSuccess");
```

`programB.emit(eventName)` 会把同名事件转给 Program C 音效映射，方便 A/B/C 早期联调。

Program A 最新 adapter 入口：

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

当前主应用已经把同一个 C 实例同步挂到 `window.programA.programC` 和 `window.programAIntegrations.programC`，旧调试面板和 A 最新分支都能读取。`audio.handleGameEvent(eventName)` 是正式音频边界；`contentDebug` 用于 B/C 联调、内容抽样和 B 侧生成 A 可见状态时排查，不应让 A 侧直接把它当正式业务状态来源。

Program A 最新 B runtime 入口：

```ts
const b = window.programAIntegrations.programB;
const state = b.getState();
b.createPackage(state);
b.selectEmotion(b.getState(), "empathy");
b.advanceDailyPhase(b.getState());
```

`programB` 会从当前 WeekOne 控制器投影 visibleState，并接收 A 侧的工作台、打包、情绪、小关卡和阶段推进命令；当前 smoke 已验证 Day 1 可从工作台推进到 Day 2，`npm run smoke:week1` 额外验证 Day 1-7 全日规则链路。正式合并 A 最新分支后，重点核对 A 的 daily-flow UI 是否按 `dailyFlow.phase` 分别展示 emotion / challenge / processing / ending。

推荐事件名：

| 事件名 | 用途 |
| --- | --- |
| `dataFlowIn` | 数据流入脉冲声 |
| `cardGenerated` | 卡牌生成 |
| `cardMovedToSlot` | 卡牌进入槽位 |
| `packageCreated` / `packageSealed` | 打包封装 |
| `neonCharged` | 霓虹充能 |
| `wasteCreated` | 废包 / 错包 |
| `transactionSuccess` / `transactionSealed` | 交易成功 / 交易封装 |
| `riskChanged` | 风险值变化 |
| `newsGenerated` | 新闻出现 |
| `newsBroadcast` | 新闻播报提示 |
| `newsTicker` | 新闻滚动短提示 |
| `publicOpinionPulse` | 舆论操控提示 |
| `emotionSelected` | 通用情绪选择 |
| `emotionEmpathySelected` | 同情选项 |
| `emotionAngerSelected` | 愤怒选项 |
| `emotionNumbnessSelected` | 麻木选项 |
| `challengeSuccess` | 小关卡通用成功 |
| `challengeFail` | 小关卡通用失败 |
| `blackBoxLine` | 黑盒台词提示 |
| `challengeBgm` | 切换到小关卡 BGM |
| `monologueType` | 每日独白打字机短音效 |
| `bgmBlackBox` | 切换到黑盒低频 BGM |
| `bgmPressure` | 切换到压力 BGM |
| `bgmSilence` | 停止当前 BGM |
| `conscienceChanged` | 清醒值变化 |
| `endingTriggered` | 结局触发 |

## 本地验收

```bash
npm run check
```

根目录可额外运行：

```bash
npm run smoke:integration
npm run smoke:week1
```

`npm run check` 会同时生成 D7 Week 1 垂直切片报告：

- `dist/week1-vertical-slice-report.json`
- `docs/week1-vertical-slice-report.md`

程序 C 工具链说明见 `docs/program-c-toolchain.md`。

最新目标：

| 项 | 目标 |
| --- | --- |
| 卡牌模板 | 20 |
| 用户画像 | 20 |
| 买家 | 15 |
| 打包配方 | 5 |
| 新闻模板 | 20 |
| 协议词 | 20 |
| 游戏内小关卡配置 | 7 |
| 数据清洗图标 | 18 |
| 舆论操控话术 | 10 |
| 用户画像拼图 | 3 |
| 买家谈判话术 | 6 |
| 协议扫描模板 | 5 |
| 证据链模板 | 1 |
| 结局报告模板 | 1 |
| 每日独白 | 7 |
| 黑盒台词 | 71 |
| 离线检查 | `externalNetworkRequired=false` |
| 包体预算 | 8MB 内 |

## 后续

- 主项目已接入可拖拽垂直切片；当前可玩规则是工作台拖拽卡槽、Day 1/2/3/4/5/6/7 小关卡，Day 7 会按清醒值进入“重组证据链”或“最后的数据包”分支，并在成功后进入 `ending` 结局报告场景。
- 后续端到端联调重点检查 A/B 卡槽数量、拖拽落槽判定、包类型枚举、新闻生成、Day 1/2/3/4/5/6/7 小关卡点击规则、证据链状态、结局报告状态、存档状态、`window.programAIntegrations.programB/C` 挂载时机和音效事件是否一致。
- 最新飞书文本配置中的最终图片导出、二维码视觉和完整 UI 文案仍是后续开发依据；如方案与实际玩法冲突，应在共享文档对应部分下补充对接问题。
- 真实音频素材接入后继续跑 `npm run check` 控制包体。
