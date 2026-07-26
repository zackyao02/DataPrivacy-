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
    const acceptedTypes = buyer.allowedPackageTypes || buyer.allowedRecipes || [];
    const accepts = acceptedTypes.includes(dataPackage.packageType || dataPackage.recipeId);
    if (!accepts) {
      return {
        ok: false,
        code: "UNSUPPORTED_RECIPE",
        message: `${buyer.name} does not purchase '${dataPackage.recipeName}'.`
      };
    }

    // Calculate dynamic transaction price
    const multipliedPrice = Math.round(dataPackage.price * buyer.priceMultiplier);
    const transactionPrice = Array.isArray(dataPackage.priceRange)
      ? clamp(multipliedPrice, dataPackage.priceRange[0], dataPackage.priceRange[1])
      : multipliedPrice;

    return {
      ok: true,
      price: transactionPrice,
      basePrice: dataPackage.price,
      multiplier: buyer.priceMultiplier
    };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
