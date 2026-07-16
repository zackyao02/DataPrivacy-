import { createGame, startDay, saveGame, loadGame } from "../src/game/index.js";

/**
 * Mock storage mimicking browser localStorage
 */
class MockStorage {
  constructor() {
    this.store = {};
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  getItem(key) {
    return this.store[key] || null;
  }
  removeItem(key) {
    delete this.store[key];
  }
}

/**
 * Runs testing assertions for save/load/reproducibility.
 * Returns { passed: boolean, errors: Array }
 */
export function runSaveLoadTests() {
  const errors = [];
  const log = (msg) => console.log(`[TEST-SAVE-LOAD] ${msg}`);

  try {
    // 1. Setup game and mock storage
    const storage = new MockStorage();
    const game = createGame({ seed: "save-load-repro-seed-999" });
    
    startDay(game);
    game.score = 520;
    game.risk.regulatory = 35.5;

    // Save Game
    const saveRes = saveGame(game, storage);
    if (!saveRes.ok) {
      errors.push("Failed to save game to mock storage.");
    }

    // Load Game
    const loadedGame = loadGame(storage);
    if (!loadedGame) {
      errors.push("Failed to load game from mock storage (returned null).");
    } else {
      if (loadedGame.score !== 520) {
        errors.push(`Loaded score mismatch. Expected 520, got ${loadedGame.score}`);
      }
      if (loadedGame.risk.regulatory !== 35.5) {
        errors.push(`Loaded regulatory risk mismatch. Expected 35.5, got ${loadedGame.risk.regulatory}`);
      }
      if (loadedGame.seed !== "save-load-repro-seed-999") {
        errors.push(`Loaded seed mismatch. Expected save-load-repro-seed-999, got ${loadedGame.seed}`);
      }
    }

    // 2. Reproducibility test under same seed
    const gameA = createGame({ seed: "reproducible-fixed-seed" });
    startDay(gameA);
    const cardIdsA = gameA.rawCards.map(c => c.id);
    const buyerIdsA = gameA.buyers.map(b => b.id);

    const gameB = createGame({ seed: "reproducible-fixed-seed" });
    startDay(gameB);
    const cardIdsB = gameB.rawCards.map(c => c.id);
    const buyerIdsB = gameB.buyers.map(b => b.id);

    // Assert absolute identical outputs for same seed!
    if (JSON.stringify(cardIdsA) !== JSON.stringify(cardIdsB)) {
      errors.push("Seed reproducibility failure: generated different daily card IDs for identical seed.");
    }
    if (JSON.stringify(buyerIdsA) !== JSON.stringify(buyerIdsB)) {
      errors.push("Seed reproducibility failure: generated different buyers for identical seed.");
    }

    log("Save/Load and Seed Reproducibility tests complete.");
  } catch (e) {
    errors.push(`Crash during save-load tests: ${e.message}`);
  }

  return {
    name: "Save/Load & Reproducibility Tests",
    passed: errors.length === 0,
    errors
  };
}
