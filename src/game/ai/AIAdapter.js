/**
 * Abstract AI Adapter representing the contract for AI categorization and analysis.
 */
export class AIAdapter {
  /**
   * Analyzes a card's contents.
   * @param {object} card - The data card
   * @returns {Promise<object>} Satirical analysis result
   */
  async analyzeCard(card) {
    throw new Error("analyzeCard method must be implemented by subclass.");
  }
}
