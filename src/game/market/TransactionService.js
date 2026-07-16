import { PricingService } from "./PricingService.js";
import { InventoryService } from "../packaging/InventoryService.js";

/**
 * Service to handle transactions of data packages.
 */
export class TransactionService {
  /**
   * Executes selling a package to a corporate buyer.
   * @param {object} gameState - Game state
   * @param {string} packageId - Package to sell
   * @param {string} buyerId - Buyer to sell to
   * @returns {object} Transaction result
   */
  static sellPackage(gameState, packageId, buyerId) {
    const dataPackage = gameState.packageInventory.find(p => p.id === packageId);
    if (!dataPackage) {
      return { ok: false, code: "PACKAGE_NOT_FOUND", message: "Package not found in inventory." };
    }

    const buyer = gameState.buyers.find(b => b.id === buyerId);
    if (!buyer) {
      return { ok: false, code: "BUYER_NOT_FOUND", message: "Buyer not found in daily buyer pool." };
    }

    // Evaluate price and compatibility
    const priceResult = PricingService.calculatePrice(dataPackage, buyer);
    if (!priceResult.ok) {
      return priceResult;
    }

    const finalPrice = priceResult.price;

    // Satirical calculation of Conscience penalty:
    // Selling highly sensitive biometric/health/social data to vultures damages conscience.
    // If cards were polluted (misclassified), players feel even worse (or maybe less, satirically, but let's say it drops conscience).
    let consciencePenalty = 0;
    if (dataPackage.recipeId === "health_risk") {
      consciencePenalty += 15;
    } else if (dataPackage.recipeId === "relationship_infiltration") {
      consciencePenalty += 12;
    } else if (dataPackage.recipeId === "precise_profile") {
      consciencePenalty += 8;
    } else {
      consciencePenalty += 5;
    }

    // Adjust conscience penalty based on card sensitivities
    const hasHighSensitivity = dataPackage.cards?.some(c => c.sensitivity === "high");
    if (hasHighSensitivity) {
      consciencePenalty += 5;
    }

    // Apply adjustments to state
    gameState.score += finalPrice;
    gameState.conscience = Math.max(0, gameState.conscience - consciencePenalty);

    // Calculate immediate risk contributions based on the buyer's greed and the package's weight
    const rc = logRiskContribution(buyer.riskContribution, dataPackage.riskWeight);

    // Record transaction
    const transactionId = `TX-${gameState.day}-${Math.floor(Math.random() * 89999 + 10000)}`;
    const txLog = {
      id: transactionId,
      packageId: dataPackage.id,
      packageName: dataPackage.recipeName,
      recipeId: dataPackage.recipeId,
      buyerId: buyer.id,
      buyerName: buyer.name,
      price: finalPrice,
      riskWeight: dataPackage.riskWeight,
      riskContribution: rc,
      day: gameState.day,
      pollutedCount: dataPackage.incorrectCardsCount,
      consciencePenalty,
      cardIds: [...dataPackage.cardIds],
      timestamp: new Date().toISOString()
    };

    gameState.transactions.push(txLog);

    // Remove from inventory
    InventoryService.removePackage(gameState, packageId);

    return {
      ok: true,
      transaction: txLog,
      newScore: gameState.score,
      newConscience: gameState.conscience
    };
  }
}

/**
 * Calculates risk contributions based on buyer's risk weights and the package's riskWeight multiplier
 */
function logRiskContribution(buyerRisk, pkgRiskWeight) {
  return {
    regulatory: parseFloat((buyerRisk.regulatory * pkgRiskWeight * 0.5).toFixed(2)),
    publicOpinion: parseFloat((buyerRisk.publicOpinion * pkgRiskWeight * 0.5).toFixed(2)),
    internalSuspicion: parseFloat((buyerRisk.internalSuspicion * pkgRiskWeight * 0.5).toFixed(2))
  };
}
