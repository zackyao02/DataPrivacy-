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

    // Text config D10/D11 keeps clarity as a news/emotion mechanic.
    const consciencePenalty = 0;
    gameState.score += finalPrice;
    gameState.conscience = gameState.clarity_score;

    // Calculate immediate risk contributions based on the buyer's greed and the package's weight
    const rc = logRiskContribution(buyer.riskContribution, dataPackage.riskWeight);

    // Record transaction
    const transactionId = `TX-${gameState.day}-${Math.floor(Math.random() * 89999 + 10000)}`;
    const txLog = {
      id: transactionId,
      packageId: dataPackage.id,
      packageName: dataPackage.recipeName,
      recipeId: dataPackage.recipeId,
      pack_type: dataPackage.packageType || dataPackage.recipeId,
      packageType: dataPackage.packageType || dataPackage.recipeId,
      buyerId: buyer.id,
      buyer: buyer.name,
      buyerName: buyer.name,
      buyerType: buyer.buyerType,
      price: finalPrice,
      riskWeight: dataPackage.riskWeight,
      riskContribution: rc,
      day: gameState.day,
      pollutedCount: dataPackage.incorrectCardsCount,
      consciencePenalty,
      cardIds: [...dataPackage.cardIds],
      userIds: [...dataPackage.userIds],
      user_ids: [...dataPackage.userIds],
      dataUse: dataPackage.dataUse,
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
