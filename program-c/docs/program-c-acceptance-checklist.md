# 程序 C 验收清单

本清单用于说明“程序 C：内容工具与音效 / 构建与性能”的当前完成度。

## 已完成

- D1：本地开发工具链、内容校验、离线检查、包体检查、Web Audio 音频管理器框架。
- D2：10 套卡牌数据、20 个用户画像、变量填充系统、数据流入音效、同情/愤怒/麻木三种情绪音效。
- D3：10 条新闻模板、每种数据包类型至少 2 条新闻、`pickNewsForPackage` 新闻匹配方法、打包/霓虹/交易音效事件。
- D4：新闻模板扩到 20 条、协议伪装配对扩到 20 组、新闻播报音效和 BGM 切换事件。
- D5：10 组数据清洗图标配置、5 组舆论操控话术、12 条黑盒评价台词、通用小关卡成败音效和黑盒台词音效绑定。
- 内容工具：`ContentRepository` 支持读取卡牌、用户、买家、新闻、协议词、打包配方、小关卡配置、数据清洗图标、舆论话术和黑盒台词。
- 打包辅助：可根据卡牌 ID 生成打包预览，返回是否可打包、缺失数据类型、匹配买家和相关新闻。
- 游戏内 Day 1 内容：`day_challenges.json` 覆盖“协议伪装”。
- 游戏内 Day 2 内容：`day_challenges.json` 覆盖“数据清洗”。
- 变量替换：支持 `{姓名}`、`{城市}`、`{金额}`、`{平台}`，可优先使用当前用户的姓名和城市。
- 音效系统：`AudioManager` 支持按游戏事件名触发 Web Audio 程序化音效。
- 内容校验：检查 ID 重复、数据类型、敏感度、包类型引用、占位符、配方可组装性、小关卡引用、新闻三情绪反馈、D2-D5 数据量、图标覆盖和黑盒台词音效绑定。
- 构建清单：生成 `dist/content-manifest.json`。
- 离线清单：生成 `dist/offline-assets.json`。
- 离线就绪检查：确认程序 C 资源不依赖外部 URL。
- 包体检查：raw 和 gzip 均低于 8MB。

## 当前数据规模

| 数据 | 数量 |
| --- | --- |
| 卡牌模板 | 10 |
| 用户画像 | 20 |
| 买家 | 3 |
| 打包配方 | 5 |
| 新闻模板 | 20 |
| 协议词 | 20 |
| 游戏内小关卡配置 | 2 |
| 数据清洗图标 | 10 |
| 舆论操控话术 | 5 |
| 黑盒台词 | 12 |
| 音效事件 | 26 |

## 当前体积

| 指标 | 数值 |
| --- | --- |
| raw | 77302 bytes |
| gzip | 25268 bytes |
| 预算 | 8388608 bytes |
| 结果 | 通过 |

## 一键验收命令

```bash
npm run check
```

## 可交接给队友的内容

- 程序 A：接入 `AudioManager`，在视觉交互事件发生时调用 `audio.handleGameEvent(eventName)`。
- 程序 B：接入 `ContentRepository`，用 `findPackagePreviews(cardIds, { onlyReady: true })` 判断当前卡槽能生成哪些包。
- 程序 B：用 `pickNewsForPackage(packageType)` 生成昨日新闻，用 `findChallengeByDay(1/2)` 读取游戏内小关卡配置。
- 程序 B：用 `findDataCleaningIcon(iconHint)`、`pickPublicOpinionScript(packageType)`、`pickBlackBoxLine(stage, filters)` 接入 D5 内容。
- 程序 A/B：可用 `newsBroadcast`、`newsTicker` 做新闻播报，用 `challengeSuccess`、`challengeFail` 做小关卡反馈，用 `bgmBlackBox`、`bgmPressure`、`bgmSilence` 做 BGM 切换。
- 策划：可继续编辑 `data/*.json`，编辑后运行 `npm run check` 检查格式和引用。

## 后续可做

- D6：主项目接入后做端到端联调，重点检查 A/B 卡槽数量、包类型枚举、新闻生成和音效事件是否一致。
- 主项目接入后做完整离线运行复核。
