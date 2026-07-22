import { SeedRandom } from "../data/seedRandom.js";
import { DataCardFactory } from "../data/DataCardFactory.js";
import { BuyerFactory } from "../market/BuyerFactory.js";
import { RiskService } from "../risk/RiskService.js";
import { content } from "../content/contentBridge.js";
import { WORKBENCH_SLOT_COUNT } from "../data/schemas.js";
import { ReportDataBuilder } from "../report/ReportDataBuilder.js";

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
    gameState.workbench = Array(WORKBENCH_SLOT_COUNT).fill(null);

    // 3. Generate text-config daily data cards and 3-5 corporate buyers
    gameState.rawCards = DataCardFactory.generateDailyCards(rng, gameState.day, gameState);
    gameState.buyers = BuyerFactory.generateDailyBuyers(rng, gameState.day);

    // Save RNG state back to game state for save file reproducibility
    gameState.rngState = rng.getState();

    // 4. Compile news from yesterday's actions
    gameState.dailyNews = this.generateDailyNews(gameState);
    gameState.dailyChallenge = content.findChallengeByDay(gameState.day);
    gameState.dailyMonologue = content.findDailyMonologueByDay(gameState.day);
    gameState.blackboxDialogue = content.findBlackboxDialogueByDay(gameState.day, gameState.endingRoute);

    return {
      ok: true,
      day: gameState.day,
      cards: gameState.rawCards,
      buyers: gameState.buyers,
      news: gameState.dailyNews,
      challenge: gameState.dailyChallenge,
      monologue: gameState.dailyMonologue,
      blackboxDialogue: gameState.blackboxDialogue
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
      gameState.endingRoute = gameState.conscience < 5 ? "final_package" : "evidence_chain";
      gameState.ending_report = ReportDataBuilder.buildEndingReport(gameState);
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
      gameState.endingRoute = gameState.conscience < 5 ? "final_package" : "evidence_chain";
      gameState.endingTriggered = true;
      gameState.ending_report = ReportDataBuilder.buildEndingReport(gameState);
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
      const welcomeNews = {
        id: "WELCOME",
        headline: "黑盒入职提示：数据分类流水线已启动",
        body: "完成打包、出售与每日指令。系统会记录你的每一次犹豫。",
        category: "neutral"
      };
      gameState.news_seen.push(welcomeNews.id);
      return welcomeNews;
    }

    // Examine yesterday's transaction log (from day - 1)
    const yesterday = currentDay - 1;
    const txs = gameState.transactions.filter(t => t.day === yesterday && t.packageType !== "waste");

    if (txs.length === 0) {
      const idleNews = {
        id: `IDLE-${currentDay}`,
        headline: "内部警报：昨日无成交记录",
        body: "黑盒标记该工位产出异常。未出售的数据仍会占用库存，并提高内部审查概率。",
        category: "internalSuspicion"
      };
      gameState.news_seen.push(idleNews.id);
      return idleNews;
    }

    const rng = new SeedRandom();
    const daySeed = rng.hash(`${gameState.seed}-news-${currentDay}`);
    rng.setState(daySeed);
    const groups = groupTransactionsByPackageType(txs);
    const [mainType] = groups.sort((a, b) => b.transactions.length - a.transactions.length);
    const mainNews = content.pickNewsForPackage(mainType.packageType, {
      transactions: mainType.transactions,
      rng
    });

    const secondaryNews = [];
    groups
      .filter(group => group.packageType !== mainType.packageType)
      .forEach(group => {
        if (rng.next() < 0.3) {
          secondaryNews.push(content.pickNewsForPackage(group.packageType, {
            transactions: group.transactions,
            rng
          }));
        }
      });

    const result = {
      ...mainNews,
      day: currentDay,
      basedOnDay: yesterday,
      transactionCount: txs.length,
      secondaryNews
    };
    [result, ...secondaryNews].forEach(news => {
      if (news.id && !gameState.news_seen.includes(news.id)) {
        gameState.news_seen.push(news.id);
      }
    });
    return result;
  }
}

function groupTransactionsByPackageType(transactions) {
  const map = new Map();
  transactions.forEach(tx => {
    const packageType = tx.packageType || tx.recipeId || tx.pack_type;
    if (!packageType) return;
    if (!map.has(packageType)) {
      map.set(packageType, []);
    }
    map.get(packageType).push(tx);
  });
  return [...map.entries()].map(([packageType, items]) => ({
    packageType,
    transactions: items
  }));
}
