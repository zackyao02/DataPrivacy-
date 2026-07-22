import {
  createGame,
  startDay,
  correctCardType,
  placeCardToSlot,
  createPackage,
  sellPackage,
  endDay,
  findChallengeByDay,
  findDailyMonologueByDay,
  pickBuyerNegotiationScript,
  pickEvidenceChainTemplate,
  pickPublicOpinionScript,
  resolveDay7Route
} from "../src/game/index.js";

/**
 * Runs testing assertions for the daily loop.
 * Returns { passed: boolean, errors: Array }
 */
export function runDayLoopTests() {
  const errors = [];
  const log = (msg) => console.log(`[TEST-DAY-LOOP] ${msg}`);

  try {
    // 1. Initialize Game
    const game = createGame({ seed: "test-day-loop-seed" });

    // 2. Play Day 1
    const day1Start = startDay(game);
    if (!day1Start.ok || game.day !== 1) {
      errors.push("Day 1 failed to start correctly.");
    }
    if (!day1Start.visibleState || !day1Start.visibleState.dailyChallenge) {
      errors.push("Day 1 start should return visibleState with a C challenge entry.");
    }
    
    if (game.rawCards.length < 2 || game.rawCards.length > 3) {
      errors.push(`Day 1 generated unexpected card count: ${game.rawCards.length}`);
    }

    // Try modifying a card category to correct AI error
    const cardToCorrect = game.rawCards[0];
    const originalType = cardToCorrect.displayedType;
    const realType = cardToCorrect.actualType;
    
    // Correct it
    const corrRes = correctCardType(game, cardToCorrect.id, realType);
    if (!corrRes.ok || cardToCorrect.displayedType !== realType || !cardToCorrect.isCorrected) {
      errors.push("Card type correction logic failed.");
    }

    // End Day 1
    const day1End = endDay(game);
    if (!day1End.ok || game.day !== 2) {
      errors.push("Ending Day 1 failed to increment day to 2.");
    }

    // 3. Play Day 2
    const day2Start = startDay(game);
    if (!day2Start.ok || game.day !== 2) {
      errors.push("Day 2 failed to start correctly.");
    }

    // Check news generated for yesterday (Day 1)
    if (!game.dailyNews || !game.dailyNews.headline) {
      errors.push("Failed to generate satirical news flash for Day 2 morning.");
    }
    if (!game.dailyChallenge || game.dailyChallenge.day !== 2) {
      errors.push("Failed to load C challenge entry for Day 2.");
    }
    if (!game.dailyMonologue || game.dailyMonologue.day !== 2) {
      errors.push("Failed to load daily monologue for Day 2.");
    }

    // End Day 2
    endDay(game);

    // 4. Play Day 3
    const day3Start = startDay(game);
    if (!day3Start.ok || game.day !== 3) {
      errors.push("Day 3 failed to start correctly.");
    }

    log("Day-loop simulation complete.");

    if (!findChallengeByDay(7) || !findDailyMonologueByDay(7)) {
      errors.push("C content bridge should expose Day 1-7 challenges and monologues.");
    }
    if (!pickBuyerNegotiationScript("health_risk")?.choices?.every(choice => choice.dealSucceeds)) {
      errors.push("Day 5 buyer negotiation script should keep both choices as successful narrative outcomes.");
    }
    if (!pickPublicOpinionScript("precise_profile")?.choices?.some(choice => choice.isSafeRewrite)) {
      errors.push("Day 3 public opinion script should provide an isSafeRewrite success option.");
    }
    if (!pickEvidenceChainTemplate()?.requiredLinks?.length) {
      errors.push("Day 7 evidence chain template should expose required links.");
    }
    game.conscience = 4;
    if (resolveDay7Route(game).route !== "final_package") {
      errors.push("conscience < 5 should route to final_package.");
    }
    game.conscience = 5;
    if (resolveDay7Route(game).route !== "evidence_chain") {
      errors.push("conscience >= 5 should route to evidence_chain.");
    }
  } catch (e) {
    errors.push(`Crash during day-loop tests: ${e.message}`);
  }

  return {
    name: "Day-Loop Simulation Tests",
    passed: errors.length === 0,
    errors
  };
}
