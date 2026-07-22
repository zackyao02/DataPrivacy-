import { WORKBENCH_SLOT_COUNT } from "../data/schemas.js";

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
    
    this.conscience = 100;   // Player's morality index (0-100)
    
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
      conscience: this.conscience,
      rawCards: this.rawCards,
      workbench: this.workbench,
      packageInventory: this.packageInventory,
      buyers: this.buyers,
      transactions: this.transactions,
      events: this.events,
      lastEvent: this.lastEvent,
      dailyChallenge: this.dailyChallenge,
      dailyMonologue: this.dailyMonologue,
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
    this.conscience = typeof obj.conscience === "number" ? obj.conscience : 100;
    this.rawCards = obj.rawCards || [];
    this.workbench = normalizeWorkbench(obj.workbench);
    this.packageInventory = obj.packageInventory || [];
    this.buyers = obj.buyers || [];
    this.transactions = obj.transactions || [];
    this.events = obj.events || [];
    this.lastEvent = obj.lastEvent || null;
    this.dailyChallenge = obj.dailyChallenge || null;
    this.dailyMonologue = obj.dailyMonologue || null;
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
      conscience: this.conscience,
      rawCards: this.rawCards,
      workbench: this.workbench,
      packageInventory: this.packageInventory,
      buyers: this.buyers,
      transactions: this.transactions,
      isGameOver: this.isGameOver,
      gameOverReason: this.gameOverReason,
      dailyNews: this.dailyNews,
      dailyChallenge: this.dailyChallenge,
      dailyMonologue: this.dailyMonologue,
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
