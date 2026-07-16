# 程序 C：内容工具与音效 / 构建与性能（Day 2）

本分支是程序 C 的 Day 2 交付分支，内容放在 `program-c/` 目录下。程序 C 负责把策划内容整理为可被程序 A / B 接入的数据包，并提供音效事件映射、离线检查和包体体积检查。

## 当前完成

- 首批内容数据：卡牌、用户画像、买家、新闻模板、协议黑话、打包配方、变量池。
- Day 1 / Day 2 小关卡配置：Day 1「协议伪装」、Day 2「数据清洗」。
- 程序 B 接口：打包预览、按天读取小关卡、买家/新闻查询、变量填充。
- 程序 A / B 音效事件映射：按统一事件名触发 Web Audio 占位音效。
- 构建与验收脚本：内容校验、离线资源清单、raw/gzip 体积报告。

## 目录

```text
program-c/
├─ data/       # JSON 内容和 Day 1 / Day 2 小关卡配置
├─ src/        # ContentRepository、schema、AudioManager
├─ scripts/    # 校验、manifest、离线和体积检查脚本
├─ docs/       # 程序C交接说明和验收清单
└─ package.json
```

## 程序 B 接入示例

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const day2Challenge = content.findChallengeByDay(2);
```

Day 2「数据清洗」配置包含 30 秒倒计时、7 个敏感数据目标、3 个干扰项，以及徽章「幽灵擦除者」。

## 程序 A / B 音效事件

```ts
audio.handleGameEvent(eventName);
```

建议统一事件名：

- `cardGenerated`
- `cardMovedToSlot`
- `packageCreated`
- `wasteCreated`
- `transactionSuccess`
- `riskChanged`
- `newsGenerated`
- `emotionSelected`
- `conscienceChanged`
- `endingTriggered`

## 本地验收

```bash
cd program-c
npm run check
```

当前本地验收已通过：内容校验、离线检查、包体检查均通过；程序 C 资源约 raw 35KB、gzip 13KB，远低于 8MB 预算。
