import { RECIPES } from "./recipes.js";

/**
 * Utility to match card combinations against recipes.
 */
export class RecipeMatcher {
  /**
   * Matches a set of cards against the recipe database.
   * @param {Array<object>} cards - Non-empty cards on the workbench slots (should be 3 cards)
   * @param {string} [preferredRecipeId] - User's chosen recipe in case of ambiguity
   * @returns {object} Matching result: { matched: boolean, ambiguous: boolean, recipe: object, candidates: Array }
   */
  static match(cards, preferredRecipeId = null) {
    // Filter out null or undefined cards
    const activeCards = cards.filter(c => c !== null && c !== undefined);

    // Recipes in this game strictly require exactly 3 cards.
    if (activeCards.length !== 3) {
      return {
        matched: false,
        ambiguous: false,
        recipe: null,
        candidates: [],
        message: "Recipes require exactly 3 data cards."
      };
    }

    // Get the displayed types of the active cards
    const types = activeCards.map(c => c.displayedType);

    // Find all recipes where requiredTypes match the types of our cards
    const candidates = RECIPES.filter(recipe => {
      return this.typesMatch(types, recipe.requiredTypes);
    });

    if (candidates.length === 0) {
      return {
        matched: false,
        ambiguous: false,
        recipe: null,
        candidates: [],
        message: "No recipe matches this combination of card categories."
      };
    }

    // Ambiguity check (e.g. precise_profile vs career_competitiveness)
    if (candidates.length > 1) {
      if (preferredRecipeId && candidates.some(r => r.id === preferredRecipeId)) {
        const selected = candidates.find(r => r.id === preferredRecipeId);
        return {
          matched: true,
          ambiguous: false,
          recipe: selected,
          candidates: candidates
        };
      } else {
        return {
          matched: false,
          ambiguous: true,
          recipe: null,
          candidates: candidates,
          message: "Ambiguous combination. Please specify which package to create."
        };
      }
    }

    // Single clear match
    return {
      matched: true,
      ambiguous: false,
      recipe: candidates[0],
      candidates: candidates
    };
  }

  /**
   * Compares two lists of types, ignoring order
   */
  static typesMatch(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, index) => val === sorted2[index]);
  }
}
