import { CardStatus } from "../data/schemas.js";

/**
 * Factory to compile DataCard objects into DataPackages or Waste.
 */
export class PackageFactory {
  /**
   * Compiles cards into a package.
   * @param {object|null} recipe - The matched recipe, or null if no match (creates waste)
   * @param {Array<object>} cards - The 3 cards used
   * @param {number} day - The current game day
   * @returns {object} The created package
   */
  static create(recipe, cards, day) {
    const activeCards = cards.filter(c => c !== null && c !== undefined);
    const cardIds = activeCards.map(c => c.id);
    const userIds = activeCards.map(c => c.userId);

    // Mark cards as packaged
    activeCards.forEach(c => {
      c.status = CardStatus.PACKAGED;
    });

    // Check if any cards have unresolved classification errors
    const incorrectCardsCount = activeCards.filter(c => c.displayedType !== c.actualType).length;

    if (!recipe) {
      // Create a WASTE package
      const id = `PKG-WASTE-${day}-${Math.floor(Math.random() * 899 + 100)}`;
      return {
        id,
        recipeId: "waste",
        recipeName: "废弃数据垃圾 (Data Waste)",
        cardIds,
        userIds,
        price: 0,
        riskWeight: activeCards.reduce((sum, c) => sum + c.riskWeight, 0) * 1.5, // Waste leaks raise suspicion
        createdDay: day,
        isWaste: true,
        incorrectCardsCount,
        cards: activeCards // store copy of cards for detail views
      };
    }

    // Create a VALID package
    const id = `PKG-${recipe.id.toUpperCase()}-${day}-${Math.floor(Math.random() * 899 + 100)}`;
    
    // Calculate initial base price as sum of card baseValues
    const sumBaseValue = activeCards.reduce((sum, c) => sum + c.baseValue, 0);
    // Recipe bonus multiplier (e.g. 1.2x for a successful combo)
    const recipeBonus = 1.25;
    
    // If the data is polluted (misclassified), there's a valuation penalty
    // 20% discount per uncorrected card
    const qualityMultiplier = Math.max(0.4, 1 - (incorrectCardsCount * 0.2));
    const price = Math.round(sumBaseValue * recipeBonus * qualityMultiplier);

    // Calculate risk weight
    // Polluted data carries higher regulatory and publicOpinion risks!
    const baseRiskWeight = activeCards.reduce((sum, c) => sum + c.riskWeight, 0);
    const riskMultiplier = 1.0 + (incorrectCardsCount * 0.4); // +40% risk per incorrect card
    const riskWeight = parseFloat((baseRiskWeight * riskMultiplier).toFixed(2));

    return {
      id,
      recipeId: recipe.id,
      recipeName: recipe.name,
      cardIds,
      userIds,
      price,
      riskWeight,
      createdDay: day,
      isWaste: false,
      incorrectCardsCount,
      cards: activeCards
    };
  }
}
