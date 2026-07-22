import { createGame, startDay, saveGame, loadGame, evaluateProtocolDisguise } from "../src/game/index.js";

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
    const challengeRes = evaluateProtocolDisguise(game, {
      P01: "优化社交连接体验",
      P02: "提升本地化服务准确性",
      P03: "保障账号安全与身份核验",
      P04: "提供个性化优惠推荐",
      P05: "用于生态服务协同",
      P06: "改善内容理解与客服质量",
      P07: "生成生活方式洞察",
      P08: "构建联系人亲密度模型"
    });
    if (!challengeRes.ok || !challengeRes.completed) {
      errors.push("Failed to complete Day 1 challenge before save/load check.");
    }

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
      if (loadedGame.challenge_history["1"]?.status !== "passed") {
        errors.push("Loaded challenge_history should preserve Day 1 passed status.");
      }
      if (!loadedGame.badges.some(badge => badge.id === "rhetoric_master")) {
        errors.push("Loaded badges should preserve the Day 1 awarded badge.");
      }
      if (!loadedGame.activeChallenge || loadedGame.activeChallenge.day !== 1) {
        errors.push("Loaded activeChallenge should preserve current daily challenge state.");
      }
      if (!loadedGame.last_save_time) {
        errors.push("Save should persist last_save_time.");
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
