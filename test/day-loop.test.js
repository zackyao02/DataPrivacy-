import { createGame, startDay, correctCardType, placeCardToSlot, createPackage, sellPackage, endDay } from "../src/game/index.js";

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

    // End Day 2
    endDay(game);

    // 4. Play Day 3
    const day3Start = startDay(game);
    if (!day3Start.ok || game.day !== 3) {
      errors.push("Day 3 failed to start correctly.");
    }

    log("Day-loop simulation complete.");
  } catch (e) {
    errors.push(`Crash during day-loop tests: ${e.message}`);
  }

  return {
    name: "Day-Loop Simulation Tests",
    passed: errors.length === 0,
    errors
  };
}
