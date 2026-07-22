import { CardStatus } from "../data/schemas.js";
import { emotionChoices } from "../../data/textConfig.js";
import { ClarityService } from "./ClarityService.js";

/**
 * Service managing moral mechanics and conscience recovery actions.
 */
export class ConscienceService {
  static applyEmotionChoice(gameState, choiceId, rng = null) {
    if (!gameState.dailyEmotion?.required) {
      return { ok: false, code: "NO_EMOTION_PENDING", message: "No daily emotion choice is pending." };
    }

    if (gameState.dailyEmotion.resolved) {
      return { ok: false, code: "EMOTION_ALREADY_SELECTED", message: "Daily emotion choice has already been selected." };
    }

    const choice = emotionChoices.find(item => item.id === choiceId);
    if (!choice) {
      return { ok: false, code: "UNKNOWN_EMOTION_CHOICE", message: "Emotion choice not found." };
    }

    const before = ClarityService.getValue(gameState);
    const after = ClarityService.addDelta(gameState, choice.delta);

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
      feedback: feedbackText,
      newsId: gameState.dailyEmotion.newsId || null
    };
    gameState.emotion_history.push(log);
    gameState.dailyEmotion = {
      ...gameState.dailyEmotion,
      resolved: true,
      selectedChoiceId: choice.id,
      selectedLabel: choice.label,
      delta: choice.delta,
      feedback: feedbackText,
      resolvedAt: new Date().toISOString()
    };
    const routeResult = Number(gameState.day) === 7 ? ClarityService.resolveDay7Route(gameState) : null;

    return {
      ok: true,
      choice,
      feedback: feedbackText,
      clarityBefore: before,
      clarityAfter: after,
      newConscience: gameState.conscience,
      dailyEmotion: gameState.dailyEmotion,
      route: routeResult?.route,
      threshold: routeResult?.threshold
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

    ClarityService.addDelta(gameState, conscienceBoost);
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
    ClarityService.addDelta(gameState, conscienceBoost);

    return {
      ok: true,
      amountSpent: amount,
      conscienceGained: conscienceBoost,
      newScore: gameState.score,
      newConscience: gameState.conscience
    };
  }
}
