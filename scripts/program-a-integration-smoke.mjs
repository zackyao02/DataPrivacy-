import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const outputPath = join(rootPath, "dist", "program-a-integration-smoke.mjs");

mkdirSync(dirname(outputPath), { recursive: true });

await build({
  absWorkingDir: rootPath,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  write: true,
  outfile: outputPath,
  stdin: {
    loader: "ts",
    resolveDir: rootPath,
    contents: `
      import { createDefaultContentRepository } from "./program-c/src/content/index.ts";
      import { createProgramCIntegration } from "./program-c/src/integration/index.ts";
      import { ProgramBBridge } from "./src/game/ProgramBBridge.ts";
      import { WeekOneSliceController } from "./src/game/WeekOneSliceController.ts";
      import { createWeekOneProgramBAdapter } from "./src/game/WeekOneProgramBAdapter.ts";

      function assert(condition, message) {
        if (!condition) {
          throw new Error(message);
        }
      }

      const content = createDefaultContentRepository({ random: () => 0 });
      const programCIntegration = createProgramCIntegration({ content });
      const contentDebug = programCIntegration.contentDebug;
      const protocolScanTemplate = contentDebug.pickProtocolScanTemplate({
        templateIds: ["protocol-scan-social-xingliao"],
      });
      const evidenceChainTemplate = contentDebug.pickEvidenceChainTemplate({
        templateIds: ["evidence-chain-week1-core"],
      });
      const endingReportTemplate = contentDebug.pickEndingReportTemplate(
        "personal-data-leak-report",
      );
      const day7BlackboxDialogue = contentDebug.findBlackboxDialogueByDay(
        7,
        "evidence_chain",
      );
      const emotionChoices = contentDebug.findEmotionChoices();

      assert(contentDebug.getKnownPackageTypes().length >= 5, "Program C should expose known package types");
      assert(emotionChoices.map((choice) => choice.id).join(",") === "sympathy,anger,numb", "Program C should expose Program B text-rule emotion ids");
      assert(emotionChoices.every((choice) => choice.programAChoiceId), "Program C emotion choices should expose Program A ids");
      assert(protocolScanTemplate, "Program C should pick a protocol scan template by options.templateIds");
      assert(evidenceChainTemplate, "Program C should pick an evidence chain template by options.templateIds");
      assert(endingReportTemplate, "Program C should pick an ending report template by id");
      assert(day7BlackboxDialogue?.highBriefing, "Program C should expose Day 7 high-awareness blackbox briefing");

      const bridge = new ProgramBBridge("workbench");
      const controller = new WeekOneSliceController(content, bridge);
      const adapter = createWeekOneProgramBAdapter(controller, bridge);

      const initialVisibleState = adapter.getVisibleState();
      assert(initialVisibleState.workbench.slotCardIds.length === 3, "visible workbench must expose 3 slots");
      assert(initialVisibleState.rawCards.length >= 6, "visible state must expose raw cards");
      assert(adapter.runtimeBinding.getState().dailyFlow.phase === "processing", "initial daily phase should be processing");

      const packageOutcome = adapter.runtimeBinding.createPackage(adapter.runtimeBinding.getState());
      assert(packageOutcome.ok, "runtime createPackage should seal the current WeekOne package");
      assert(adapter.runtimeBinding.getState().dailyNews, "package seal should produce visible daily news");

      const emotionOutcome = adapter.runtimeBinding.selectEmotion(
        adapter.runtimeBinding.getState(),
        "empathy",
      );
      assert(emotionOutcome.ok, "runtime selectEmotion should be accepted");
      assert(adapter.runtimeBinding.getState().dailyEmotion.resolved, "emotion should be marked resolved");

      const phaseOutcome = adapter.runtimeBinding.advanceDailyPhase(adapter.runtimeBinding.getState());
      assert(phaseOutcome.ok, "runtime advanceDailyPhase should enter the challenge");

      const challengeState = adapter.runtimeBinding.getState();
      const challenge = challengeState.dailyChallenge;
      assert(challenge, "challenge should be visible after advancing from news");
      assert(challenge.status === "active", "challenge should be active");
      assert(challenge.tasks.length > 0, "challenge should expose tasks");

      const challengeOutcome = adapter.runtimeBinding.submitDailyChallenge(
        challengeState,
        challenge.id,
        {
          kind: challenge.kind,
          answers: challenge.tasks.map((task) => ({
            taskId: task.id,
            optionIds: task.options.map((option) => option.id),
          })),
        },
      );
      assert(challengeOutcome.ok, "runtime submitDailyChallenge should complete Day 1");
      assert(adapter.runtimeBinding.getState().day === 2, "successful Day 1 should unlock Day 2");
      assert(adapter.getVisibleState().dailyFlow.phase === "processing", "visible state should return to processing after Day 1");

      adapter.destroy();
      bridge.destroy();
      programCIntegration.destroy();
    `,
  },
});

await import(`${pathToFileURL(outputPath).href}?t=${Date.now()}`);
console.log("Program A/B/C integration smoke passed.");
