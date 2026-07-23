import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const outputPath = join(rootPath, "dist", "week-one-rules-smoke.mjs");

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
      import { ProgramBBridge } from "./src/game/ProgramBBridge.ts";
      import { WeekOneSliceController } from "./src/game/WeekOneSliceController.ts";
      import { createWeekOneProgramBAdapter } from "./src/game/WeekOneProgramBAdapter.ts";

      function assert(condition, message) {
        if (!condition) {
          throw new Error(message);
        }
      }

      function assertOutcome(outcome, message) {
        if (!outcome.ok) {
          throw new Error(message + " (" + outcome.code + ": " + outcome.message + ")");
        }
      }

      function task(challenge, taskId) {
        const found = challenge.tasks.find((item) => item.id === taskId);
        assert(found, "missing challenge task: " + taskId);
        return found;
      }

      function option(task, predicate, message) {
        const found = task.options.find(predicate);
        assert(found, message);
        return found.id;
      }

      function submitChoice(runtime, challenge, optionId) {
        return runtime.submitDailyChallengeChoice(
          runtime.getState(),
          challenge.id,
          optionId,
        );
      }

      function startDay(runtime, day) {
        const state = runtime.getState();
        assert(state.day === day, "expected Day " + day + ", got Day " + state.day);
        assert(state.dailyFlow.phase === "processing", "Day " + day + " should start in processing");

        assertOutcome(
          runtime.createPackage(state),
          "Day " + day + " package creation failed",
        );
        assert(runtime.getState().dailyNews, "Day " + day + " should expose daily news after package creation");

        assertOutcome(
          runtime.selectEmotion(runtime.getState(), "anger"),
          "Day " + day + " emotion selection failed",
        );
        assert(runtime.getState().dailyEmotion.resolved, "Day " + day + " emotion should be resolved");

        assertOutcome(
          runtime.advanceDailyPhase(runtime.getState()),
          "Day " + day + " challenge start failed",
        );

        const challenge = runtime.getState().dailyChallenge;
        assert(challenge, "Day " + day + " should expose a challenge");
        assert(challenge.status === "active", "Day " + day + " challenge should be active");
        return challenge;
      }

      function assertDayCompleted(runtime, day) {
        const state = runtime.getState();

        if (day < 7) {
          assert(state.day === day + 1, "Day " + day + " should unlock Day " + (day + 1));
          assert(state.dailyFlow.phase === "processing", "Day " + day + " should return to processing");
          return;
        }

        assert(state.endingAvailable, "Day 7 should expose ending availability");
        assert(state.ending_report, "Day 7 should expose an ending report");
        assert(state.dailyFlow.phase === "ending", "Day 7 should enter ending phase");
      }

      function completeProtocolMatch(runtime, challenge) {
        const terms = task(challenge, "protocol-terms");
        let outcome = null;

        for (const termOption of terms.options) {
          outcome = submitChoice(runtime, challenge, termOption.id);
        }

        assertOutcome(outcome, "Day 1 protocol match did not complete");
      }

      function completeDataCleaning(runtime, challenge) {
        const cleaning = task(challenge, "cleaning-items");
        const sensitiveOptions = cleaning.options.filter((item) =>
          item.description?.startsWith("sensitive /"),
        );
        assert(sensitiveOptions.length >= cleaning.minSelections, "Day 2 should expose enough sensitive items");

        let outcome = null;
        for (const sensitiveOption of sensitiveOptions) {
          outcome = submitChoice(runtime, challenge, sensitiveOption.id);
        }

        assertOutcome(outcome, "Day 2 data cleaning did not complete");
      }

      function completePublicOpinion(runtime, challenge) {
        const publicOpinion = task(challenge, "public-opinion-tactic");
        const safeOptionId = option(
          publicOpinion,
          (item) => item.label === "安全改写" || item.description?.includes("安全"),
          "Day 3 should expose one safe public-opinion rewrite",
        );
        const outcome = submitChoice(runtime, challenge, safeOptionId);
        assertOutcome(outcome, "Day 3 public opinion did not complete");
      }

      function completeProfilePuzzle(runtime, controller, challenge) {
        const puzzle = task(challenge, "profile-fragments");
        const optionIds = new Set(puzzle.options.map((item) => item.id));
        const fragments = controller
          .getSnapshot()
          .miniGame.puzzleFragments
          .filter((item) => !item.decoy)
          .sort((left, right) => left.correctOrder - right.correctOrder);
        assert(fragments.length >= puzzle.minSelections, "Day 4 should expose enough real puzzle fragments");

        let outcome = null;
        for (const fragment of fragments) {
          const optionId = "fragment:" + fragment.id;
          assert(optionIds.has(optionId), "Day 4 missing visible option for fragment " + fragment.id);
          outcome = submitChoice(runtime, challenge, optionId);
        }

        assertOutcome(outcome, "Day 4 profile puzzle did not complete");
      }

      function completeBuyerNegotiation(runtime, challenge) {
        const negotiation = task(challenge, "buyer-negotiation-option");
        assert(negotiation.options.length > 0, "Day 5 should expose buyer negotiation options");
        const outcome = submitChoice(runtime, challenge, negotiation.options[0].id);
        assertOutcome(outcome, "Day 5 buyer negotiation did not complete");
      }

      function completeProtocolScan(runtime, controller, challenge) {
        const clauses = task(challenge, "risk-clauses");
        const flows = task(challenge, "data-flow");
        const hidden = task(challenge, "hidden-clause");
        const riskAnswer = task(challenge, "risk-answer");
        const expectedRisk = controller.getSnapshot().miniGame.protocolScanTemplate?.riskQuestion.answer;
        assert(expectedRisk, "Day 6 should expose the expected risk answer");

        for (const clause of clauses.options) {
          submitChoice(runtime, challenge, clause.id);
        }

        for (const flow of flows.options) {
          submitChoice(runtime, challenge, flow.id);
        }

        submitChoice(runtime, challenge, hidden.options[0].id);
        const outcome = submitChoice(runtime, challenge, "risk:" + expectedRisk);
        assertOutcome(outcome, "Day 6 protocol scan did not complete");
      }

      function completeEvidenceChain(runtime, challenge) {
        const days = task(challenge, "evidence-days");
        const connections = task(challenge, "evidence-connections");
        const upload = task(challenge, "upload");

        for (const dayOption of days.options) {
          submitChoice(runtime, challenge, dayOption.id);
        }

        for (const connectionOption of connections.options) {
          submitChoice(runtime, challenge, connectionOption.id);
        }

        const outcome = submitChoice(runtime, challenge, upload.options[0].id);
        assertOutcome(outcome, "Day 7 evidence chain did not complete");
      }

      const content = createDefaultContentRepository({ random: () => 0 });
      const bridge = new ProgramBBridge("workbench");
      const controller = new WeekOneSliceController(content, bridge);
      const adapter = createWeekOneProgramBAdapter(controller, bridge);
      const runtime = adapter.runtimeBinding;

      const expectedKinds = [
        "protocol-match",
        "data-cleaning",
        "public-opinion",
        "profile-puzzle",
        "buyer-negotiation",
        "protocol-scan",
        "final-package",
      ];

      for (let day = 1; day <= 7; day += 1) {
        const challenge = startDay(runtime, day);
        assert(
          challenge.kind === expectedKinds[day - 1],
          "Day " + day + " expected " + expectedKinds[day - 1] + ", got " + challenge.kind,
        );

        switch (day) {
          case 1:
            completeProtocolMatch(runtime, challenge);
            break;
          case 2:
            completeDataCleaning(runtime, challenge);
            break;
          case 3:
            completePublicOpinion(runtime, challenge);
            break;
          case 4:
            completeProfilePuzzle(runtime, controller, challenge);
            break;
          case 5:
            completeBuyerNegotiation(runtime, challenge);
            break;
          case 6:
            completeProtocolScan(runtime, controller, challenge);
            break;
          case 7:
            completeEvidenceChain(runtime, challenge);
            break;
        }

        assertDayCompleted(runtime, day);
      }

      assert(runtime.getState().badges.length >= 7, "Week 1 should unlock all 7 badges");

      adapter.destroy();
      bridge.destroy();
    `,
  },
});

await import(`${pathToFileURL(outputPath).href}?t=${Date.now()}`);
console.log("Week 1 rules smoke passed.");
