import { runPackagingTests } from "./packaging.test.js";
import { runDayLoopTests } from "./day-loop.test.js";
import { runSaveLoadTests } from "./save-load.test.js";

const suites = [
  runPackagingTests(),
  runDayLoopTests(),
  runSaveLoadTests()
];

let failed = 0;

for (const suite of suites) {
  if (suite.passed) {
    console.log(`PASS ${suite.name}`);
    continue;
  }

  failed += 1;
  console.error(`FAIL ${suite.name}`);
  for (const error of suite.errors) {
    console.error(`- ${error}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
