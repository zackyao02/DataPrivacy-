import { GameState } from "./GameState.js";

/**
 * Service to handle saving and loading game states to localStorage or mock storage.
 */
export class SaveService {
  static SAVE_KEY = "privacy_irony_game_save_v1";

  /**
   * Saves the game state.
   * @param {GameState} gameState - GameState instance
   * @param {object} storage - Storage object (e.g. window.localStorage or a custom test dictionary)
   * @returns {object} Saving result
   */
  static saveGame(gameState, storage) {
    if (!gameState) {
      return { ok: false, code: "MISSING_STATE", message: "No state to save." };
    }
    if (!storage || typeof storage.setItem !== "function") {
      return { ok: false, code: "STORAGE_UNAVAILABLE", message: "Storage backend not available." };
    }

    try {
      const data = gameState.serialize();
      storage.setItem(this.SAVE_KEY, JSON.stringify(data));
      return { ok: true, message: "Game successfully saved." };
    } catch (e) {
      return { ok: false, code: "SAVE_ERROR", message: `Failed to serialize state: ${e.message}` };
    }
  }

  /**
   * Loads the game state.
   * @param {object} storage - Storage object
   * @returns {GameState|null} Rehydrated GameState instance, or null if none exists
   */
  static loadGame(storage) {
    if (!storage || typeof storage.getItem !== "function") {
      return null;
    }

    try {
      const serialized = storage.getItem(this.SAVE_KEY);
      if (!serialized) {
        return null; // No save file found
      }

      const data = JSON.parse(serialized);
      const gameState = new GameState(data.seed);
      gameState.deserialize(data);
      return gameState;
    } catch (e) {
      console.error("Failed to load saved game state:", e);
      return null;
    }
  }

  /**
   * Clears saved state
   */
  static clearSave(storage) {
    if (storage && typeof storage.removeItem === "function") {
      storage.removeItem(this.SAVE_KEY);
      return { ok: true };
    }
    return { ok: false };
  }
}
