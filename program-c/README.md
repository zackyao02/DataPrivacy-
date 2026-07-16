# Program C 开发包

本目录是程序 C 的本地开发包，暂不上传仓库。内容严格按飞书文档和共享文档里的职责整理：内容工具、音效、构建与性能。

## 已包含

- `data/`：首批最小闭环 JSON 内容，已覆盖 Day 1 / Day 2 小关卡配置。
- `src/content/schema.ts`：内容数据类型约定。
- `src/content/ContentRepository.ts`：内容读取、变量填充、打包预览、每日关卡读取工具。
- `src/audio/AudioManager.ts`：基于 Web Audio API 的事件音效管理器。
- `src/audio/soundMap.ts`：程序 B 事件名到音效 ID 的映射。
- `scripts/validate-content.mjs`：JSON 内容校验。
- `scripts/bundle-size-report.mjs`：8MB 包体预算检查。

## 本地检查

```bash
npm run validate:content
npm run report:size
```

当前不依赖外部包，Node.js 可直接运行脚本。

## 与队友交接

程序 A 可监听程序 B 的事件通道，并把事件转给 `AudioManager.handleGameEvent(event.type)`。

程序 B 需要尽量统一抛出这些事件：

- `cardGenerated`
- `packageCreated`
- `wasteCreated`
- `transactionSuccess`
- `riskChanged`
- `newsGenerated`
- `emotionSelected`
- `conscienceChanged`
- `endingTriggered`

程序 B 判断打包时可直接用：

```ts
const readyPackages = content.findPackagePreviews(selectedCardIds, {
  onlyReady: true,
});
```

Day 2 小关卡可直接读取：

```ts
const day2Challenge = content.findChallengeByDay(2);
```
