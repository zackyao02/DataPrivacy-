import { SeedRandom } from "../data/seedRandom.js";
import { DataCardFactory } from "../data/DataCardFactory.js";
import { BuyerFactory } from "../market/BuyerFactory.js";
import { RiskService } from "../risk/RiskService.js";
import { newsDatabase } from "../../data/mockContent.js";

/**
 * Controller managing the daily sequence transitions.
 */
export class DayController {
  /**
   * Starts a game day. Refreshes cards, buyers, and compiles yesterday's news.
   * @param {object} gameState - The current game state
   */
  static startDay(gameState) {
    if (gameState.isGameOver) {
      return { ok: false, code: "GAME_OVER", message: "Game is already over." };
    }

    // 1. Initialize SeedRandom for reproducible day-to-day results.
    // If no state exists yet, we initialize using the base seed + day.
    const rng = new SeedRandom();
    if (gameState.rngState !== null && gameState.rngState !== undefined) {
      rng.setState(gameState.rngState);
    } else {
      rng.setState(rng.hash(`${gameState.seed}-day-${gameState.day}`));
    }

    // 2. Clear old daily pool and workbench cards (raw cards expire each day)
    gameState.rawCards = [];
    gameState.workbench = [null, null, null, null];

    // 3. Generate 2-3 data cards and 3-5 corporate buyers
    gameState.rawCards = DataCardFactory.generateDailyCards(rng, gameState.day);
    gameState.buyers = BuyerFactory.generateDailyBuyers(rng, gameState.day);

    // Save RNG state back to game state for save file reproducibility
    gameState.rngState = rng.getState();

    // 4. Compile news from yesterday's actions
    gameState.dailyNews = this.generateDailyNews(gameState);

    return {
      ok: true,
      day: gameState.day,
      cards: gameState.rawCards,
      buyers: gameState.buyers,
      news: gameState.dailyNews
    };
  }

  /**
   * Ends a game day. Runs risk settlements and increments the day.
   * @param {object} gameState - The current game state
   */
  static endDay(gameState) {
    if (gameState.isGameOver) {
      return { ok: false, code: "GAME_OVER", message: "Game is already over." };
    }

    // 1. Run Risk Service settlements
    const settlement = RiskService.settleDailyRisk(gameState);
    
    if (settlement.isGameOver) {
      gameState.isGameOver = true;
      gameState.gameOverReason = settlement.breached[0];
      return {
        ok: true,
        settlement,
        isGameOver: true,
        reason: gameState.gameOverReason,
        message: "A critical threshold was breached. Game Over!"
      };
    }

    // 2. Check if Day 7 is reached (the 7-day loop completes)
    if (gameState.day >= 7) {
      gameState.isGameOver = true;
      gameState.gameOverReason = "SUCCESS_7_DAYS";
      return {
        ok: true,
        settlement,
        isGameOver: true,
        reason: "SUCCESS_7_DAYS",
        message: "You survived the 7-day corporate grind!"
      };
    }

    // 3. Move to the next day
    const completedDay = gameState.day;
    gameState.day += 1;

    // Reset RNG state to null so the next startDay creates a new day-based seed
    // if the state wasn't explicitly saved/restored, guaranteeing progression.
    gameState.rngState = null;

    return {
      ok: true,
      completedDay,
      nextDay: gameState.day,
      settlement,
      isGameOver: false
    };
  }

  /**
   * Compiles yesterday's transactions to generate satirical news headlines.
   */
  static generateDailyNews(gameState) {
    const currentDay = gameState.day;
    if (currentDay === 1) {
      return {
        headline: "WELCOME TO CLOUD METRICS INC.",
        body: "Automated Data Classification pipeline goes live! Help train the model, package profiles, and hit our high-yield sales target.",
        category: "neutral"
      };
    }

    // Examine yesterday's transaction log (from day - 1)
    const yesterday = currentDay - 1;
    const txs = gameState.transactions.filter(t => t.day === yesterday);

    if (txs.length === 0) {
      return {
        headline: "OFFICE ALERT: IDLE STATION DETECTED",
        body: "Internal audit flags severe drop in transaction volume. Managers warn: 'Unsold data is a storage liability.'",
        category: "internalSuspicion"
      };
    }

    // Find if there was high risk or pollution in yesterday's sold packages
    let totalPollution = 0;
    let highRiskSold = false;
    txs.forEach(t => {
      totalPollution += t.pollutedCount;
      if (t.riskWeight > 5) highRiskSold = true;
    });

    // Pick satirical news headline based on yesterday's profile
    const rng = new SeedRandom();
    // seed the headline selection deterministically with the day index + seed
    const daySeed = rng.hash(`${gameState.seed}-news-${currentDay}`);
    rng.setState(daySeed);

    if (totalPollution > 1) {
      return {
        headline: rng.pick(newsDatabase.regulatory),
        body: `An investigation reveals massive customer profiles compiled from corrupted 'classification errors'. Consumer forums are in uproar.`,
        category: "regulatory"
      };
    }

    if (highRiskSold) {
      return {
        headline: rng.pick(newsDatabase.publicOpinion),
        body: `Reports claim several highly-sensitive data profiles were sold directly to hostile pricing syndicates. Standard citizens are complaining.`,
        category: "publicOpinion"
      };
    }

    // Default to a neutral or internal humor article
    const coin = rng.rangeInt(0, 1);
    if (coin === 0) {
      return {
        headline: rng.pick(newsDatabase.internalSuspicion),
        body: "Compliance officers reinforce: logs are updated in real-time. Employee retention rates remain under deep telemetry tracking.",
        category: "internalSuspicion"
      };
    } else {
      return {
        headline: rng.pick(newsDatabase.neutral),
        body: "Shares in data brokers reach record valuations as algorithmic accuracy is declared 'secondary to total transaction velocity.'",
        category: "neutral"
      };
    }
  }
}
