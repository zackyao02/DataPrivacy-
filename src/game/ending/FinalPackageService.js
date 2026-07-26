import { finalEmployeeCard, finalPackageConfig } from "../../data/textConfig.js";
import { CardStatus } from "../data/schemas.js";
import { InventoryService } from "../packaging/InventoryService.js";
import { ReportDataBuilder } from "../report/ReportDataBuilder.js";
import { ChallengeService } from "../challenges/ChallengeService.js";
import { ClarityService } from "../risk/ClarityService.js";

export class FinalPackageService {
  static createFinalEmployeePackage(gameState) {
    const routeCheck = validateFinalRoute(gameState);
    if (!routeCheck.ok) return routeCheck;

    const existing = gameState.packageInventory.find(pkg => pkg.packageType === finalPackageConfig.packageType);
    const buyer = ensureAnonymousBuyer(gameState);
    if (existing) {
      return { ok: true, package: existing, packageId: existing.id, buyer, route: routeCheck.route };
    }

    const card = findEmployeeCard(gameState);
    if (!card) {
      return {
        ok: false,
        code: "FINAL_EMPLOYEE_CARD_NOT_FOUND",
        message: "Day 7 employee data card is missing."
      };
    }

    card.status = CardStatus.PACKAGED;
    const nickname = gameState.nickname || "第996号员工";
    const dataPackage = {
      id: `PKG-FINAL-${gameState.day}-${stableSuffix([card.id, nickname])}`,
      recipeId: finalPackageConfig.recipeId,
      packageType: finalPackageConfig.packageType,
      recipeName: finalPackageConfig.recipeName.replace("{nickname}", nickname),
      cardIds: [card.id],
      userIds: [card.userId || "EMPLOYEE_SELF"],
      price: finalPackageConfig.price,
      basePrice: finalPackageConfig.price,
      priceRange: [finalPackageConfig.price, finalPackageConfig.price],
      riskWeight: finalPackageConfig.riskWeight,
      createdDay: gameState.day,
      isWaste: false,
      incorrectCardsCount: 0,
      cards: [card],
      dataUse: finalPackageConfig.dataUse,
      route: finalPackageConfig.route,
      isFinalEmployeePackage: true
    };

    gameState.packageInventory.push(dataPackage);
    removeEmployeeCardFromWorkbench(gameState, card.id);

    return {
      ok: true,
      package: dataPackage,
      packageId: dataPackage.id,
      packageType: dataPackage.packageType,
      buyer,
      route: routeCheck.route,
      clarity: routeCheck.clarity,
      threshold: routeCheck.threshold
    };
  }

  static sellFinalEmployeePackage(gameState, packageId = null, buyerId = null) {
    const routeCheck = validateFinalRoute(gameState);
    if (!routeCheck.ok) return routeCheck;

    let dataPackage = packageId
      ? gameState.packageInventory.find(pkg => pkg.id === packageId)
      : gameState.packageInventory.find(pkg => pkg.packageType === finalPackageConfig.packageType);

    if (!dataPackage) {
      const created = this.createFinalEmployeePackage(gameState);
      if (!created.ok) return created;
      dataPackage = created.package;
    }

    if (dataPackage.packageType !== finalPackageConfig.packageType) {
      return { ok: false, code: "NOT_FINAL_PACKAGE", message: "Only the final employee package can be sold on this route." };
    }

    const buyer = ensureAnonymousBuyer(gameState);
    if (buyerId && buyerId !== buyer.id) {
      return { ok: false, code: "BUYER_NOT_ALLOWED", message: "The final employee package can only be sold to the anonymous buyer." };
    }

    const transaction = {
      id: `TX-FINAL-${gameState.day}-${stableSuffix([dataPackage.id, buyer.id])}`,
      packageId: dataPackage.id,
      packageName: dataPackage.recipeName,
      recipeId: dataPackage.recipeId,
      pack_type: dataPackage.packageType,
      packageType: dataPackage.packageType,
      buyerId: buyer.id,
      buyer: buyer.name,
      buyerName: buyer.name,
      buyerType: buyer.buyerType,
      price: dataPackage.price,
      riskWeight: dataPackage.riskWeight,
      riskContribution: { ...buyer.riskContribution },
      day: gameState.day,
      pollutedCount: 0,
      consciencePenalty: 0,
      cardIds: [...dataPackage.cardIds],
      userIds: [...dataPackage.userIds],
      user_ids: [...dataPackage.userIds],
      dataUse: dataPackage.dataUse,
      route: finalPackageConfig.route,
      timestamp: new Date().toISOString()
    };

    gameState.score += transaction.price;
    gameState.transactions.push(transaction);
    InventoryService.removePackage(gameState, dataPackage.id);
    gameState.endingRoute = finalPackageConfig.route;
    gameState.endingTriggered = true;
    gameState.isGameOver = true;
    gameState.gameOverReason = "SUCCESS_7_DAYS";
    markDay7FinalChallengeComplete(gameState, transaction.id);
    gameState.ending_report = ReportDataBuilder.buildEndingReport(gameState);

    return {
      ok: true,
      transaction,
      buyer,
      route: finalPackageConfig.route,
      endingTriggered: true,
      report: gameState.ending_report
    };
  }

  static completeFinalEmployeePackage(gameState) {
    const created = this.createFinalEmployeePackage(gameState);
    if (!created.ok) return created;
    return this.sellFinalEmployeePackage(gameState, created.packageId, created.buyer.id);
  }
}

function validateFinalRoute(gameState) {
  if (Number(gameState.day) !== 7) {
    return { ok: false, code: "NOT_DAY_7", message: "The final employee package route is only available on Day 7." };
  }
  if (gameState.dailyEmotion?.required && !gameState.dailyEmotion.resolved) {
    return {
      ok: false,
      code: "EMOTION_CHOICE_REQUIRED",
      message: "请先完成 Day 7 早间新闻后的情绪选择。"
    };
  }

  const routeResult = ClarityService.resolveDay7Route(gameState);
  if (routeResult.route !== finalPackageConfig.route) {
    return {
      ok: false,
      code: "FINAL_ROUTE_LOCKED",
      message: ClarityService.getConfig().lockedPathMessage,
      ...routeResult
    };
  }

  return { ok: true, ...routeResult };
}

function ensureAnonymousBuyer(gameState) {
  const existing = gameState.buyers.find(buyer => buyer.id === finalPackageConfig.anonymousBuyer.id);
  if (existing) return existing;

  const buyer = {
    ...finalPackageConfig.anonymousBuyer,
    allowedPackageTypes: [...finalPackageConfig.anonymousBuyer.allowedPackageTypes],
    allowedRecipes: [...finalPackageConfig.anonymousBuyer.allowedRecipes],
    riskContribution: { ...finalPackageConfig.anonymousBuyer.riskContribution }
  };
  gameState.buyers.push(buyer);
  return buyer;
}

function findEmployeeCard(gameState) {
  return gameState.rawCards.find(card => card.cardId === finalEmployeeCard.cardId)
    || gameState.workbench.find(card => card?.cardId === finalEmployeeCard.cardId)
    || null;
}

function removeEmployeeCardFromWorkbench(gameState, cardId) {
  gameState.workbench = gameState.workbench.map(card => card?.id === cardId ? null : card);
  gameState.rawCards = gameState.rawCards.filter(card => card.id !== cardId);
}

function markDay7FinalChallengeComplete(gameState, transactionId) {
  const state = ChallengeService.ensureDailyChallengeState(gameState, 7);
  Object.assign(state, {
    status: "passed",
    passed: true,
    completed: true,
    skipped: false,
    route: finalPackageConfig.route,
    finalTransactionId: transactionId,
    completedAt: new Date().toISOString()
  });
  gameState.activeChallenge = state;
}

function stableSuffix(parts) {
  const value = parts.join("|");
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return String(Math.abs(hash) % 900 + 100);
}
