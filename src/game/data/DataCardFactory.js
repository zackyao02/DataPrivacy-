import { mockUserProfiles } from "../../data/mockContent.js";
import { CardStatus } from "./schemas.js";

/**
 * Factory for creating DataCard instances deterministically.
 */
export class DataCardFactory {
  /**
   * Generates a list of cards for a specific day.
   * @param {SeedRandom} rng - The seeded random generator
   * @param {number} day - The current game day (1-7)
   * @returns {Array<object>} An array of generated DataCard objects
   */
  static generateDailyCards(rng, day) {
    // Generate between 2 to 3 cards per day
    const cardCount = rng.rangeInt(2, 3);
    const cards = [];

    // Shuffle mock profiles to avoid repeating in the exact same order,
    // but do it deterministically with the daily seed state
    const templates = rng.shuffle(mockUserProfiles);

    for (let i = 0; i < cardCount; i++) {
      const template = templates[i % templates.length];
      
      // Determine sensitivity, possibly with small variance
      const sensitivity = template.sensitivity;
      
      // Construct the card
      const card = {
        id: `CARD-${day}-${i + 1}-${rng.rangeInt(100, 999)}`,
        userId: template.userId,
        title: template.title,
        detail: template.detail,
        actualType: template.actualType,
        displayedType: template.displayedType, // Start with AI-misclassified type
        sensitivity: sensitivity,
        baseValue: template.baseValue,
        riskWeight: template.riskWeight,
        status: CardStatus.AVAILABLE,
        isCorrected: false, // Flag to track if corrected by player
        originalDisplayedType: template.displayedType // Store for reference
      };
      
      cards.push(card);
    }

    return cards;
  }
}
