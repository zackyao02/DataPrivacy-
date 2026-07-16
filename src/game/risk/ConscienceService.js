import { CardStatus } from "../data/schemas.js";

/**
 * Service managing moral mechanics and conscience recovery actions.
 */
export class ConscienceService {
  /**
   * Erases a data card entirely from the dashboard to protect the user's privacy.
   * @param {object} gameState - Current state
   * @param {string} cardId - Card to erase
   * @returns {object} Result with moral outcomes
   */
  static deleteCardToSaveConscience(gameState, cardId) {
    const card = gameState.rawCards.find(c => c.id === cardId);
    if (!card) {
      return { ok: false, code: "CARD_NOT_FOUND", message: "Card not found." };
    }

    if (card.status !== CardStatus.AVAILABLE) {
      return { ok: false, code: "INVALID_STATUS", message: "Only undeployed available cards can be deleted." };
    }

    // Satirical trade-off: deleting data saves your conscience,
    // but raises internal corporate suspicion as files go missing!
    card.status = "deleted";
    
    const conscienceBoost = card.sensitivity === "high" ? 15 : card.sensitivity === "medium" ? 8 : 4;
    const suspicionIncrease = card.sensitivity === "high" ? 12 : card.sensitivity === "medium" ? 6 : 3;

    gameState.conscience = Math.min(100, gameState.conscience + conscienceBoost);
    gameState.risk.internalSuspicion = Math.min(100, gameState.risk.internalSuspicion + suspicionIncrease);

    return {
      ok: true,
      card,
      conscienceRecovered: conscienceBoost,
      suspicionIncurred: suspicionIncrease,
      newConscience: gameState.conscience,
      newSuspicion: gameState.risk.internalSuspicion
    };
  }

  /**
   * Spend corporate points to donate to a privacy NGO to bribe the player's conscience.
   * @param {object} gameState - Game state
   * @param {number} amount - Amount of score/money to donate
   * @returns {object} Donation result
   */
  static donateToNGO(gameState, amount) {
    if (gameState.score < amount) {
      return { ok: false, code: "INSUFFICIENT_FUNDS", message: "Not enough points to purchase moral relief." };
    }

    if (amount <= 0) {
      return { ok: false, code: "INVALID_AMOUNT", message: "Donation must be greater than 0." };
    }

    // Spend score to reclaim conscience
    gameState.score -= amount;
    // Bribe rate: 10 points = 1 conscience
    const conscienceBoost = Math.floor(amount / 10);
    gameState.conscience = Math.min(100, gameState.conscience + conscienceBoost);

    return {
      ok: true,
      amountSpent: amount,
      conscienceGained: conscienceBoost,
      newScore: gameState.score,
      newConscience: gameState.conscience
    };
  }
}
