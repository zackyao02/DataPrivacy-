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
    this.workbench = [null, null, null, null]; // 4 slots for card combining
    this.packageInventory = [];    // Compiled packages waiting to be sold
    this.buyers = [];              // Buyers refreshed for the day
    this.transactions = [];        // Cumulative list of all completed transaction logs
    
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
    this.workbench = obj.workbench || [null, null, null, null];
    this.packageInventory = obj.packageInventory || [];
    this.buyers = obj.buyers || [];
    this.transactions = obj.transactions || [];
    this.rngState = obj.rngState;
    this.isGameOver = !!obj.isGameOver;
    this.gameOverReason = obj.gameOverReason || null;
    this.dailyNews = obj.dailyNews || null;
  }
}
