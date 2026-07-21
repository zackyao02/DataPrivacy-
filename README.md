# 程序 C：内容工具与音效 / 构建与性能

本分支是程序 C 的交付分支：`feature/program-c-content-audio-build`。核心文件放在 `program-c/` 目录下。

## 当前完成

- D1：本地工具链、内容校验、离线资源清单、包体检查、Web Audio 音频管理器框架。
- D2：初版数据卡牌、20 个用户画像、变量填充系统、数据流入音效、同情/愤怒/麻木三种情绪音效。
- D3：10 条新闻模板、新闻与数据包类型匹配方法、打包封装/霓虹充能/交易封装音效事件。
- D4：新闻模板扩到 20 条，协议伪装配对扩到 20 组，补充新闻播报音效和 BGM 切换事件。
- D5：数据清洗图标配置、5 组舆论操控话术、12 条黑盒评价台词、通用小关卡成功/失败音效和黑盒台词音效绑定。
- D6：Day 4 用户画像拼图内容库、Day 5 买家谈判纯叙事话术、7 天每日独白、小关卡 BGM 和独白打字机音效。
- D7：Week 1 垂直切片内容整合验收、音效整合检查、包体/加载初测报告、工具链文档。
- 架构审查修复：Program C 加入 TypeScript 验收；打包预览会拦截未知卡、重复卡和额外卡；主应用调试入口已接入 C 的内容仓库和音效管理器。
- D7 后联调：主应用已把 `workbench`、`news`、`mini-game` 替换成可点击 Week 1 垂直切片场景，串通卡槽打包、新闻反馈、情绪选择、小关卡入口和 C 侧音效事件。
- D8：小关卡由占位判定升级为内容驱动交互，接入 Day 1 协议伪装、Day 2 数据清洗、Day 4 画像拼图、Day 5 买家谈判、Day 6 快速协议扫描，以及清醒值驱动的结局分支原型。
- D7 内容对齐补充：按最新飞书“文本配置”更新 Week 1 垂直切片验收前已有内容口径，升级为 20 张正式数据卡、15 个买家、18 个清洗图标、10 组舆论题、3 套画像拼图、5 套协议扫描模板和 65 条黑盒台词；新增同步脚本并修正工作台起始卡池。Day 3 / Day 7 完整分支 / 结局报告 / UI 文案尚未接成完整流程，只作为后续开发依据。

## 接入重点

程序 B 可调用内容接口：

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage(packageType);
const challenge = content.findChallengeByDay(4); // 支持 1 / 2 / 4 / 5 / 6
const opinion = content.pickPublicOpinionScript(packageType);
const blackBoxLine = content.pickBlackBoxLine("package_review", { packageType });
const profilePuzzle = content.pickProfilePuzzleByDay(4);
const negotiation = content.pickBuyerNegotiationScript(packageType);
const monologue = content.findDailyMonologueByDay(day);
```

`readyPackages` 只返回严格匹配配方的结果；如果传入未知卡、重复卡或额外卡，预览对象会保留问题字段，但不会进入 `onlyReady` 结果。

主应用调试入口已挂载 C：

```ts
window.programA.programC.content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});
window.programA.programC.audio.handleGameEvent("newsBroadcast");
window.programA.programB.emit("newsBroadcast");
```

当前可玩联调路径：

1. 切到 `workbench` 场景，点击数据卡调整 3 个槽位。
2. 点击“封装数据包”，有效组合会进入 `news` 场景并触发封装/新闻音效。
3. 在 `news` 场景选择同情、愤怒或麻木，再点击“进入小关卡”。
4. 在 `mini-game` 场景按当天任务点击：Day 1 伪装协议术语、Day 2 清理敏感项、Day 4 依次拼画像碎片、Day 5 选择谈判话术、Day 6 标记协议风险；成功会解锁下一天，Day 6 成功后显示结局分支原型。

程序 A / B 可调用音效接口：

```ts
audio.handleGameEvent(eventName);
```

主要事件名包括：

- `dataFlowIn`
- `packageCreated`
- `packageSealed`
- `neonCharged`
- `wasteCreated`
- `transactionSuccess`
- `transactionSealed`
- `newsBroadcast`
- `newsTicker`
- `publicOpinionPulse`
- `challengeBgm`
- `monologueType`
- `challengeSuccess`
- `challengeFail`
- `blackBoxLine`
- `emotionEmpathySelected`
- `emotionAngerSelected`
- `emotionNumbnessSelected`
- `bgmBlackBox`
- `bgmPressure`
- `bgmSilence`
- `endingTriggered`

## 本地验收

```bash
cd program-c
npm run check
```

当前验收通过：

- cards=20
- users=20
- buyers=15
- recipes=5
- news=20
- protocolTerms=20
- dayChallenges=5
- dataCleaningIcons=18
- publicOpinionScripts=10
- profilePuzzles=3
- buyerNegotiationScripts=6
- protocolScanTemplates=5
- dailyMonologues=7
- blackBoxLines=65
- raw=157635 bytes
- gzip=39605 bytes
- 低于 8MB 预算

完整交接说明见 `program-c/docs/program-c-integration.md`。
Program C 交付索引见 `program-c/docs/program-c-delivery-index.md`，可按 D1-D8 快速核对对应交付物。
D7 垂直切片报告见 `program-c/docs/week1-vertical-slice-report.md`，工具链说明见 `program-c/docs/program-c-toolchain.md`，验收清单见 `program-c/docs/program-c-acceptance-checklist.md`。
