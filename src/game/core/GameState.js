import { WORKBENCH_SLOT_COUNT } from "../data/schemas.js";
import { clarityConfig } from "../../data/textConfig.js";

/**
 * Core Game State Container.
 * Holds all dynamic state variables of the 7-day loop.
 */
export class GameState {
  constructor(seed = "data-privacy-hack-default") {
    this.seed = seed;
    this.day = 1;
    this.score = 0;
    
    // Risk state
    this.risk = {
      regulatory: 0,         // Risk of government audit / lawsuit (0-100)
      publicOpinion: 0,      // Risk of viral exposure / activist protest (0-100)
      internalSuspicion: 0   // Risk of manager audits / getting fired (0-100)
    };
    
    this.clarity_score = clarityConfig.initialValue;
    this.conscience = clarityConfig.initialValue; // Backward-compatible alias used by A/C branch checks
    this.emotion_history = [];
    this.dailyEmotion = null;
    this.news_seen = [];
    this.challenge_history = {};
    this.activeChallenge = null;
    this.nickname = "第996号员工";
    this.tutorial_done = false;
    this.random_seed = seed;
    this.last_save_time = null;
    
    // Pools
    this.rawCards = [];            // Active available data cards for the day
    this.workbench = Array(WORKBENCH_SLOT_COUNT).fill(null); // 3 slots for card combining
    this.packageInventory = [];    // Compiled packages waiting to be sold
    this.buyers = [];              // Buyers refreshed for the day
    this.transactions = [];        // Cumulative list of all completed transaction logs
    this.events = [];              // UI-facing event history
    this.lastEvent = null;         // Last UI event emitted by Program B
    this.dailyChallenge = null;    // C-provided challenge entry for the current day
    this.dailyMonologue = null;    // C-provided monologue entry for the current day
    this.blackboxDialogue = null;   // Daily blackbox dialogue from text config
    this.badges = [];
    this.ending_report = null;
    this.endingTriggered = false;
    this.endingRoute = null;
    
    // RNG state
    this.rngState = null;          // Holds SeedRandom's current state
    
    this.isGameOver = false;
    this.gameOverReason = null;    // Reason for early exit
    this.dailyNews = null;         // News broadcast triggered at the beginning of the day
  }

  /**
   * Serializes the current state into a JSON-friendly plain object
   */
  serialize() {
    return {
      seed: this.seed,
      day: this.day,
      score: this.score,
      risk: { ...this.risk },
      clarity_score: this.clarity_score,
      conscience: this.conscience,
      emotion_history: this.emotion_history,
      dailyEmotion: this.dailyEmotion,
      news_seen: this.news_seen,
      challenge_history: this.challenge_history,
      activeChallenge: this.activeChallenge,
      nickname: this.nickname,
      tutorial_done: this.tutorial_done,
      random_seed: this.random_seed,
      last_save_time: this.last_save_time,
      rawCards: this.rawCards,
      workbench: this.workbench,
      packageInventory: this.packageInventory,
      inventory: this.packageInventory,
      buyers: this.buyers,
      transactions: this.transactions,
      sold_log: this.transactions,
      events: this.events,
      lastEvent: this.lastEvent,
      dailyChallenge: this.dailyChallenge,
      dailyMonologue: this.dailyMonologue,
      blackboxDialogue: this.blackboxDialogue,
      badges: this.badges,
      ending_report: this.ending_report,
      endingTriggered: this.endingTriggered,
      endingRoute: this.endingRoute,
      rngState: this.rngState,
      isGameOver: this.isGameOver,
      gameOverReason: this.gameOverReason,
      dailyNews: this.dailyNews
    };
  }

  /**
   * Deserializes and restores state from a plain object
   */
  deserialize(obj) {
    if (!obj) return;
    this.seed = obj.seed || "data-privacy-hack-default";
    this.day = Number(obj.day) || 1;
    this.score = Number(obj.score) || 0;
    this.risk = obj.risk ? { ...obj.risk } : { regulatory: 0, publicOpinion: 0, internalSuspicion: 0 };
    this.clarity_score = normalizeClarity(obj.clarity_score, obj.conscience);
    this.conscience = this.clarity_score;
    this.emotion_history = obj.emotion_history || [];
    this.dailyEmotion = obj.dailyEmotion || null;
    this.news_seen = obj.news_seen || [];
    this.challenge_history = normalizeChallengeHistory(obj.challenge_history);
    this.activeChallenge = obj.activeChallenge || this.challenge_history[String(this.day)] || null;
    this.nickname = obj.nickname || "第996号员工";
    this.tutorial_done = !!obj.tutorial_done;
    this.random_seed = obj.random_seed || this.seed;
    this.last_save_time = obj.last_save_time || null;
    this.rawCards = obj.rawCards || [];
    this.workbench = normalizeWorkbench(obj.workbench);
    this.packageInventory = obj.packageInventory || obj.inventory || [];
    this.buyers = obj.buyers || [];
    this.transactions = obj.transactions || obj.sold_log || [];
    this.events = obj.events || [];
    this.lastEvent = obj.lastEvent || null;
    this.dailyChallenge = obj.dailyChallenge || null;
    this.dailyMonologue = obj.dailyMonologue || null;
    this.blackboxDialogue = obj.blackboxDialogue || null;
    this.badges = obj.badges || [];
    this.ending_report = obj.ending_report || null;
    this.endingTriggered = !!obj.endingTriggered;
    this.endingRoute = obj.endingRoute || null;
    this.rngState = obj.rngState;
    this.isGameOver = !!obj.isGameOver;
    this.gameOverReason = obj.gameOverReason || null;
    this.dailyNews = obj.dailyNews || null;
  }

  /**
   * Returns the UI-safe state shape consumed by Program A.
   * This intentionally excludes internal RNG state.
   */
  toVisibleState() {
    return {
      seed: this.seed,
      day: this.day,
      score: this.score,
      risk: { ...this.risk },
      clarity_score: this.clarity_score,
      conscience: this.conscience,
      emotion_history: this.emotion_history,
      dailyEmotion: this.dailyEmotion,
      news_seen: this.news_seen,
      challenge_history: this.challenge_history,
      activeChallenge: this.activeChallenge,
      nickname: this.nickname,
      tutorial_done: this.tutorial_done,
      random_seed: this.random_seed,
      last_save_time: this.last_save_time,
      rawCards: this.rawCards,
      workbench: this.workbench,
      packageInventory: this.packageInventory,
      inventory: this.packageInventory,
      buyers: this.buyers,
      transactions: this.transactions,
      sold_log: this.transactions,
      isGameOver: this.isGameOver,
      gameOverReason: this.gameOverReason,
      dailyNews: this.dailyNews,
      dailyChallenge: this.dailyChallenge,
      dailyMonologue: this.dailyMonologue,
      blackboxDialogue: this.blackboxDialogue,
      badges: this.badges,
      ending_report: this.ending_report,
      endingTriggered: this.endingTriggered,
      endingRoute: this.endingRoute,
      lastEvent: this.lastEvent,
      events: this.events
    };
  }
}

function normalizeWorkbench(workbench) {
  const slots = Array(WORKBENCH_SLOT_COUNT).fill(null);
  if (Array.isArray(workbench)) {
    for (let index = 0; index < WORKBENCH_SLOT_COUNT; index += 1) {
      slots[index] = workbench[index] || null;
    }
  }
  return slots;
}

function normalizeClarity(clarityScore, conscience) {
  if (typeof clarityScore === "number") {
    return Math.max(clarityConfig.min, Math.min(clarityConfig.max, clarityScore));
  }
  if (typeof conscience === "number" && conscience >= clarityConfig.min && conscience <= clarityConfig.max) {
    return Math.max(clarityConfig.min, Math.min(clarityConfig.max, conscience));
  }
  return clarityConfig.initialValue;
}

function normalizeChallengeHistory(history) {
  if (!history) return {};
  if (Array.isArray(history)) {
    return history.reduce((acc, item) => {
      if (item?.day) acc[String(item.day)] = item;
      return acc;
    }, {});
  }
  return { ...history };
}
