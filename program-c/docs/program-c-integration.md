# 程序 C 交接说明

本开发包覆盖“程序 C：内容工具与音效 / 构建与性能”。文档中未完全定稿的部分，程序 C 按主线方向和联调需要做了小范围优化。

## 分工表进度

| 开发日 | 程序 C 任务 | 当前状态 |
| --- | --- | --- |
| D1 | 工具链、音频框架、性能/离线检查基础 | 已完成 |
| D2 | 10 套卡牌、20 个用户画像、变量填充、数据流入音效、三种情绪音效 | 已完成 |
| D3 | 10 条新闻模板、新闻匹配算法、打包/交易音效 | 已完成 |
| D4 | 新闻扩到 20 条、协议伪装配对扩到 20 组、新闻播报音效、BGM 切换 | 已完成 |
| D5 | 数据清洗图标、舆论操控话术、黑盒评价台词、小关卡通用成败音效 | 已完成 |

## 内容文件

| 文件 | 用途 |
| --- | --- |
| `data/card_templates.json` | 10 套数据卡模板 |
| `data/users.json` | 20 个用户画像 |
| `data/buyers.json` | 买家和可接受的数据包类型 |
| `data/variables.json` | `{姓名}`、`{城市}`、`{金额}`、`{平台}` 占位符池 |
| `data/news_templates.json` | 20 条新闻模板，每种数据包类型至少 4 条 |
| `data/protocol_terms.json` | 20 组协议伪装配对 |
| `data/package_recipes.json` | 5 种数据包配方 |
| `data/day_challenges.json` | Day 1 / Day 2 游戏内小关卡配置 |
| `data/data_cleaning_icons.json` | Day 2 数据清洗图标视觉配置 |
| `data/public_opinion_scripts.json` | 5 组舆论操控话术模板 |
| `data/black_box_lines.json` | 12 条黑盒评价台词和音效绑定 |

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
```

常用能力：

- `findPackagePreviews(cardIds, { onlyReady: true })`：判断当前卡槽能生成哪些包。
- `findNewsForPackage(packageType)`：读取指定包类型的新闻列表。
- `pickNewsForPackage(packageType)`：从指定包类型中随机抽一条新闻。
- `findChallengeByDay(1)`：读取 Day 1 “协议伪装”配置。
- `findChallengeByDay(2)`：读取 Day 2 “数据清洗”配置。
- `findDataCleaningIcon(iconHint)`：读取 Day 2 图标视觉配置。
- `pickPublicOpinionScript(packageType)`：按包类型抽取舆论操控话术。
- `pickBlackBoxLine(stage, filters)`：按阶段、天数或包类型抽取黑盒台词。

## 程序 A / B 接入音效

```ts
import { AudioManager } from "./audio";

const audio = new AudioManager({ masterVolume: 0.72 });

window.addEventListener("pointerdown", () => {
  void audio.unlock();
}, { once: true });

audio.handleGameEvent("dataFlowIn");
audio.handleGameEvent("newsBroadcast");
audio.handleGameEvent("challengeSuccess");
audio.handleGameEvent("blackBoxLine");
audio.handleGameEvent("bgmPressure");
```

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
| `bgmBlackBox` | 切换到黑盒低频 BGM |
| `bgmPressure` | 切换到压力 BGM |
| `bgmSilence` | 停止当前 BGM |
| `conscienceChanged` | 清醒值变化 |
| `endingTriggered` | 结局触发 |

## 本地验收

```bash
npm run check
```

最新目标：

| 项 | 目标 |
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
| 离线检查 | `externalNetworkRequired=false` |
| 包体预算 | 8MB 内 |

## 后续

- D6：主项目接入后做端到端联调，重点检查 A/B 卡槽数量、包类型枚举、新闻生成和音效事件是否一致。
- 真实音频素材接入后继续跑 `npm run check` 控制包体。
