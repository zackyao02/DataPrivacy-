import { buyerPool } from "../../data/mockContent.js";

/**
 * Factory to generate daily corporate buyers.
 */
export class BuyerFactory {
  /**
   * Generates a set of buyers for a specific day.
   * @param {SeedRandom} rng - Seed random engine
   * @param {number} day - The current game day
   * @returns {Array<object>} Refreshed buyers
   */
  static generateDailyBuyers(rng, day) {
    // Generate between 3 to 5 buyers per day
    const count = rng.rangeInt(3, 5);
    const shuffled = rng.shuffle(buyerPool);
    const buyers = [];

    for (let i = 0; i < count; i++) {
      const template = shuffled[i % shuffled.length];
      
      // Inject slight seed-based random variance in price multiplier (+/- 0.15)
      const variance = rng.range(-0.15, 0.15);
      const customizedMultiplier = parseFloat((template.priceMultiplier + variance).toFixed(2));

      buyers.push({
        id: `BUYER-${day}-${i + 1}-${template.id}`,
        templateId: template.id,
        name: template.name,
        description: template.description,
        allowedRecipes: template.allowedRecipes,
        priceMultiplier: customizedMultiplier,
        riskContribution: { ...template.riskContribution }
      });
    }

    return buyers;
  }
}
