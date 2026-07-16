/**
 * Service to calculate dynamic pricing for transactions.
 */
export class PricingService {
  /**
   * Calculates the transaction price for selling a package to a buyer.
   * @param {object} dataPackage - The DataPackage to sell
   * @param {object} buyer - The Buyer buying it
   * @returns {object} pricing details
   */
  static calculatePrice(dataPackage, buyer) {
    if (!dataPackage) {
      return { ok: false, code: "PACKAGE_NOT_FOUND", message: "Package is missing." };
    }
    if (!buyer) {
      return { ok: false, code: "BUYER_NOT_FOUND", message: "Buyer is missing." };
    }

    // Waste packages are worthless
    if (dataPackage.isWaste || dataPackage.recipeId === "waste") {
      return { ok: false, code: "WASTE_NOT_SELLABLE", message: "Waste packages cannot be sold." };
    }

    // Check if the buyer accepts this recipe
    const accepts = buyer.allowedRecipes.includes(dataPackage.recipeId);
    if (!accepts) {
      return {
        ok: false,
        code: "UNSUPPORTED_RECIPE",
        message: `${buyer.name} does not purchase '${dataPackage.recipeName}'.`
      };
    }

    // Calculate dynamic transaction price
    const transactionPrice = Math.round(dataPackage.price * buyer.priceMultiplier);

    return {
      ok: true,
      price: transactionPrice,
      basePrice: dataPackage.price,
      multiplier: buyer.priceMultiplier
    };
  }
}
