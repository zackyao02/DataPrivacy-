# 程序 C：内容工具与音效 / 构建与性能

本分支是程序 C 的交付分支：`feature/program-c-content-audio-build`。核心文件放在 `program-c/` 目录下。

## 当前完成

- D1：本地工具链、内容校验、离线资源清单、包体检查、Web Audio 音频管理器框架。
- D2：10 套数据卡牌、20 个用户画像、变量填充系统、数据流入音效、同情/愤怒/麻木三种情绪音效。
- D3：10 条新闻模板、新闻与数据包类型匹配方法、打包封装/霓虹充能/交易封装音效事件。
- D4：新闻模板扩到 20 条，协议伪装配对扩到 20 组，补充新闻播报音效和 BGM 切换事件。
- D5：数据清洗图标配置、5 组舆论操控话术、12 条黑盒评价台词、通用小关卡成功/失败音效和黑盒台词音效绑定。

## 接入重点

程序 B 可调用内容接口：

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});

const news = content.pickNewsForPackage(packageType);
const challenge = content.findChallengeByDay(1); // 或 2
const opinion = content.pickPublicOpinionScript(packageType);
const blackBoxLine = content.pickBlackBoxLine("package_review", { packageType });
```

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
- `challengeSuccess`
- `challengeFail`
- `blackBoxLine`
- `emotionEmpathySelected`
- `emotionAngerSelected`
- `emotionNumbnessSelected`
- `bgmBlackBox`
- `bgmPressure`
- `bgmSilence`

## 本地验收

```bash
cd program-c
npm run check
```

当前验收通过：

- cards=10
- users=20
- buyers=3
- recipes=5
- news=20
- protocolTerms=20
- dayChallenges=2
- dataCleaningIcons=10
- publicOpinionScripts=5
- blackBoxLines=12
- raw=77302 bytes
- gzip=25268 bytes
- 低于 8MB 预算

完整交接说明见 `program-c/docs/program-c-integration.md`。
