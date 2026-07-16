# 程序 C：内容工具与音效 / 构建与性能

本分支是程序 C 的交付分支，分支名为 `feature/program-c-content-audio-build`，文件放在 `program-c/` 目录下。

## 当前完成

- 分工表 D1：本地工具链、内容校验、离线资源清单、包体检查、Web Audio 音频管理器框架。
- 分工表 D2：10 套数据卡片、20 个用户画像、变量填充系统、数据流入音效、同情/愤怒/麻木三种情绪音效。
- 分工表 D3：10 条新闻模板、新闻与数据包类型匹配方法、打包封装/霓虹充能/交易封装音效事件。
- 游戏内小关卡目前只包含 Day 1「协议伪装」和 Day 2「数据清洗」。

## 接入重点

程序 B：

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage(packageType);
const challenge = content.findChallengeByDay(1); // 或 2
```

程序 A / B 音效：

```ts
audio.handleGameEvent(eventName);
```

新增可用事件包括：`dataFlowIn`、`packageSealed`、`neonCharged`、`transactionSealed`、`emotionEmpathySelected`、`emotionAngerSelected`、`emotionNumbnessSelected`。

## 本地验收

```bash
cd program-c
npm run check
```

当前验收通过：cards=10，users=20，news=10，dayChallenges=2，raw=45916 bytes，gzip=15945 bytes，低于 8MB 预算。
