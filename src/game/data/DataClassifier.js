/**
 * Classifier logic to handle user correction of AI classification errors.
 */
export class DataClassifier {
  /**
   * Corrects the displayed type of a data card.
   * @param {object} card - The DataCard object to correct
   * @param {string} selectedType - The new DataType chosen by the user
   * @returns {object} Result showing success and matching status
   */
  static correctType(card, selectedType) {
    if (!card) {
      return { ok: false, code: "CARD_NOT_FOUND", message: "Card not found." };
    }
    
    if (card.status !== "available" && card.status !== "workbench") {
      return { ok: false, code: "INVALID_STATUS", message: "Can only correct available cards." };
    }

    card.displayedType = selectedType;
    card.isCorrected = (selectedType === card.actualType);
    
    return {
      ok: true,
      card: card,
      isCorrectlyClassified: card.isCorrected
    };
  }
}
