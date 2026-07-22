import { CardStatus } from "../data/schemas.js";
import { emotionChoices } from "../../data/textConfig.js";

const clarityRange = { min: -6, max: 12 };

/**
 * Service managing moral mechanics and conscience recovery actions.
 */
export class ConscienceService {
  static applyEmotionChoice(gameState, choiceId, rng = null) {
    const choice = emotionChoices.find(item => item.id === choiceId);
    if (!choice) {
      return { ok: false, code: "UNKNOWN_EMOTION_CHOICE", message: "Emotion choice not found." };
    }

    const before = gameState.clarity_score || 0;
    const after = clamp(before + choice.delta, clarityRange.min, clarityRange.max);
    gameState.clarity_score = after;
    gameState.conscience = after;

    const feedbackText = rng && typeof rng.pick === "function"
      ? rng.pick(choice.feedback)
      : choice.feedback[0];
    const log = {
      day: gameState.day,
      choiceId: choice.id,
      label: choice.label,
      delta: choice.delta,
      before,
      after,
      feedback: feedbackText
    };
    gameState.emotion_history.push(log);

    return {
      ok: true,
      choice,
      feedback: feedbackText,
      clarityBefore: before,
      clarityAfter: after,
      newConscience: gameState.conscience
    };
  }

  static getEmotionChoices() {
    return emotionChoices;
  }

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
    
    const conscienceBoost = card.sensitivity === "high" ? 2 : card.sensitivity === "medium" ? 1 : 0;
    const suspicionIncrease = card.sensitivity === "high" ? 12 : card.sensitivity === "medium" ? 6 : 3;

    gameState.clarity_score = clamp((gameState.clarity_score || 0) + conscienceBoost, clarityRange.min, clarityRange.max);
    gameState.conscience = gameState.clarity_score;
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
    // Kept only for older UI compatibility; official text-config clarity comes from emotion choices.
    const conscienceBoost = Math.floor(amount / 200);
    gameState.clarity_score = clamp((gameState.clarity_score || 0) + conscienceBoost, clarityRange.min, clarityRange.max);
    gameState.conscience = gameState.clarity_score;

    return {
      ok: true,
      amountSpent: amount,
      conscienceGained: conscienceBoost,
      newScore: gameState.score,
      newConscience: gameState.conscience
    };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
