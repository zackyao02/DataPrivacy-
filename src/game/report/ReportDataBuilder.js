import { packageConfigs, reportConfig } from "../../data/textConfig.js";

/**
 * Service to build reports and endings for the summary and epilogue pages.
 */
export class ReportDataBuilder {
  /**
   * Compiles daily score and risk statistics.
   */
  static buildDailySummary(gameState, dayIndex) {
    const dayTxs = gameState.transactions.filter(tx => tx.day === dayIndex);
    const totalEarnings = dayTxs.reduce((sum, tx) => sum + tx.price, 0);
    const totalConscienceLost = dayTxs.reduce((sum, tx) => sum + tx.consciencePenalty, 0);
    const totalPolluted = dayTxs.reduce((sum, tx) => sum + tx.pollutedCount, 0);

    const deletedCardsCount = gameState.rawCards.filter(c => c.status === "deleted").length;

    return {
      day: dayIndex,
      earnings: totalEarnings,
      conscienceLost: totalConscienceLost,
      pollutionCount: totalPolluted,
      deletedCount: deletedCardsCount,
      transactionsCount: dayTxs.length
    };
  }

  /**
   * Compiles final epilogue/ending report details.
   */
  static buildEndingReport(gameState) {
    const totalTxs = gameState.transactions.length;
    const totalEarnings = gameState.transactions.reduce((sum, tx) => sum + tx.price, 0);
    const totalConscienceLost = gameState.transactions.reduce((sum, tx) => sum + tx.consciencePenalty, 0);
    const endingKey = resolveEndingKey(gameState);
    const packageCounts = countBy(gameState.transactions, tx => tx.packageType || tx.recipeId);
    const buyerCount = new Set(gameState.transactions.map(tx => tx.buyerId)).size;
    const affectedUserIds = [...new Set(gameState.transactions.flatMap(tx => tx.userIds || tx.user_ids || []))];
    const dataUses = [...new Set(gameState.transactions.map(tx => tx.dataUse).filter(Boolean))];
    const packageBreakdown = Object.entries(packageCounts).map(([packageType, count]) => ({
      packageType,
      name: packageConfigs[packageType]?.name || packageType,
      count,
      dataUse: packageConfigs[packageType]?.dataUse
    }));
    const badgeNames = gameState.badges.map(badge => badge.name);
    const rating = reportConfig.literacyRating[endingKey];
    const endingTitle = endingKey === "ending_b" ? "结局：举报者" : "结局：替罪羊";
    const endingBody = endingKey === "ending_b"
      ? "你提交了证据链。数据包、买家网络、新闻受害者和黑盒指令第一次被完整连起来。"
      : "你完成了最后的数据包。屏幕上出现自己的名字时，你才意识到试用期员工也只是库存的一部分。";

    return {
      title: reportConfig.title,
      endingTitle,
      endingBody,
      rating,
      literacyRating: rating,
      playerNickname: gameState.nickname,
      days: 7,
      totalEarnings,
      totalConscienceLost,
      totalTxs,
      buyerCount,
      affectedUserIds,
      dataUses,
      packageBreakdown,
      badges: badgeNames,
      comment: reportConfig.comments[endingKey],
      advice: reportConfig.advice,
      clarity_score: gameState.clarity_score,
      dayReached: gameState.day,
      endingKey
    };
  }
}

function resolveEndingKey(gameState) {
  if (gameState.endingRoute === "evidence_chain" || (gameState.conscience || 0) >= 5) {
    return "ending_b";
  }
  return "ending_a";
}

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
