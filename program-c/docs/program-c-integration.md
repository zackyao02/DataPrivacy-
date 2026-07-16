# 程序C交接说明

本开发包按飞书文档和共享文档整理，范围只覆盖“程序C：内容工具与音效 / 构建与性能”。当前只做本地开发，不自动上传 GitHub 或 Google 文档。

## 负责范围

- 内容工具：维护卡牌、用户、买家、新闻、黑话协议、打包配方等 JSON。
- 音效系统：按统一游戏事件名触发轻量 Web Audio 占位音效。
- 构建与性能：校验内容结构，生成内容清单，生成离线资源清单，检查 8MB 包体预算和 gzip 后体积。

不覆盖范围：

- 主界面视觉实现。
- Day 1 到 Day 7 的完整流程控制。
- 存档系统、双结局路径、分享页。
- 完整游戏离线试玩验收。

以上由其他程序同学负责，程序C只提供可接入资源、工具和检查脚本。

## 内容文件

| 文件 | 用途 |
| --- | --- |
| `data/card_templates.json` | 数据卡模板，覆盖社交、位置、消费、生物识别、健康、关系图谱 |
| `data/users.json` | 用户画像池 |
| `data/buyers.json` | 买家和可接受的包类型 |
| `data/variables.json` | `{姓名}`、`{城市}`、`{金额}`、`{平台}` 占位符池 |
| `data/news_templates.json` | Day 7 新闻和三种情绪反馈文本 |
| `data/protocol_terms.json` | 黑盒指令库 / 协议黑话解释 |
| `data/package_recipes.json` | 打包配方，供程序B判定包是否合法 |
| `data/day_challenges.json` | Day 1 / Day 2 小关卡配置，含协议伪装和数据清洗 |

## 共享约定

| 项 | 约定 |
| --- | --- |
| 清醒值变量 | `conscience` |
| 数据类型 | `social`、`location`、`consumption`、`biometric`、`health`、`contact_graph` |
| 敏感度 | `low`、`medium`、`high` |
| 情绪选项 | `empathy`、`anger`、`numbness` |
| 火山 API | 不参与核心判定，只能作为文本解释 / 分类提示 |

## 程序B接入内容

```ts
import {
  createDefaultContentRepository,
  defaultContentBundle,
} from "./content";

const content = createDefaultContentRepository();
const user = content.pickUser();
const locationCards = content.findCardsByDataType("location");
const buyers = content.findBuyersForPackage("精准画像包");
const recipes = content.findRecipesForDataTypes(["location", "consumption", "social"]);
const cardTitle = content.fillVariables(locationCards[0].title, { user });
const day2Challenge = content.findChallengeByDay(2);
```

如果主工程不允许直接从 `data/` 导入 JSON，可以改为由程序B在启动时加载 JSON，然后传给 `new ContentRepository(bundle)`。

### 打包预览

程序B可以把当前槽位里的卡牌 ID 交给程序C，直接得到哪些包已经可生成、哪些数据类型还缺、可卖给哪些买家，以及后续可触发的新闻模板。

```ts
const selectedCardIds = [
  "card-location-night-commute",
  "card-consumption-medical-store",
  "card-social-work-complaint",
];

const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const preview = content.createPackagePreview("精准画像包", selectedCardIds);

if (preview.ready) {
  const buyer = preview.buyers[0];
  const news = preview.newsTemplates[0];
}
```

`preview.missingDataTypes` 可用于提示还差什么卡，`preview.unknownCardIds` 可用于排查程序B传入了不存在的卡牌 ID。

### Day 2 小关卡

Day 2 已补上「数据清洗」配置。程序B可以按天读取关卡，程序A根据 `type` 渲染对应交互。

```ts
const challenge = content.findChallengeByDay(2);

if (challenge?.type === "data_cleaning") {
  const targets = challenge.sensitiveItems;
  const decoys = challenge.decoyItems;
  const requiredClicks = challenge.successCondition.requiredSensitiveClicks;
}
```

Day 2 配置包含：

- 30 秒倒计时。
- 7 个敏感数据目标，覆盖位置、关系图谱、生物识别、健康、消费、社交、跨平台身份关联。
- 3 个干扰项：备份文件、审计日志、系统核心。
- 成功徽章：`幽灵擦除者`。

## 程序A/B接入音效

```ts
import { AudioManager } from "./audio";

const audio = new AudioManager({ masterVolume: 0.72 });

window.addEventListener("pointerdown", () => {
  void audio.unlock();
}, { once: true });

audio.handleGameEvent("packageCreated");
```

推荐事件名如下：

| 事件名 | 用途 |
| --- | --- |
| `cardGenerated` | 卡牌生成 |
| `cardMovedToSlot` | 卡牌进入槽位 |
| `packageCreated` | 打包成功 |
| `wasteCreated` | 废包 / 错包 |
| `transactionSuccess` | 交易成功 |
| `riskChanged` | 风险值变化 |
| `newsGenerated` | 新闻出现 |
| `emotionSelected` | 三选项情绪反馈 |
| `conscienceChanged` | 清醒值变化 |
| `endingTriggered` | 结局触发 |

## 本地验收

```bash
npm run check
```

如果 Windows PowerShell 阻止 `npm.ps1`，使用：

```bash
cmd /c npm run check
```

验收内容：

- JSON 结构合法，ID 不重复。
- 数据类型、敏感度、包类型引用一致。
- 每个打包配方都有对应买家、新闻模板和可组装的数据卡。
- Day 1 / Day 2 小关卡配置存在且引用合法。
- 卡牌覆盖 6 种数据类型。
- 占位符只使用 `{姓名}`、`{城市}`、`{金额}`、`{平台}`。
- 新闻文本包含 `empathy`、`anger`、`numbness` 三种反馈。
- 自动生成 `dist/content-manifest.json`。
- 自动生成 `dist/offline-assets.json`。
- 程序C资源不依赖外部 URL。
- 统计 raw 体积和 gzip 体积是否低于 8MB。

## 当前验收结果

| 项 | 结果 |
| --- | --- |
| 内容校验 | 通过 |
| 卡牌数量 | 6 |
| 用户数量 | 5 |
| 买家数量 | 3 |
| 打包配方 | 5 |
| 新闻模板 | 5 |
| 协议词 | 10 |
| 小关卡配置 | 2 |
| 离线检查 | 通过，`externalNetworkRequired=false` |
| raw 体积 | 以 `cmd /c npm run check` 输出为准 |
| gzip 体积 | 以 `cmd /c npm run check` 输出为准 |
| 8MB 预算 | 通过 |

## 当前状态

- 首批最小闭环内容已完成。
- 程序C本地包体远低于 8MB 预算。
- 音效暂为纯 Web Audio 程序化占位音，不依赖外部音频文件，方便离线演示。
- 后续如果要接真实音效文件，需要把文件加入 `dist/offline-assets.json` 生成逻辑，并继续跑 `npm run check`。
