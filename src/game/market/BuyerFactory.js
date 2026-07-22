import { buyerDesigns, dailyRhythm, marketEvents, packageConfigs } from "../../data/textConfig.js";

const reputationMultiplier = {
  S: 1.18,
  A: 1,
  B: 0.86
};

const reputationRisk = {
  S: { regulatory: 1, publicOpinion: 1, internalSuspicion: 0.5 },
  A: { regulatory: 1.5, publicOpinion: 1.6, internalSuspicion: 0.8 },
  B: { regulatory: 2.4, publicOpinion: 2.8, internalSuspicion: 1.2 }
};

const dayPackageFocus = {
  1: "precise_profile",
  2: "health_risk",
  3: "credit_score",
  4: "career_competitiveness",
  5: "health_risk",
  6: "relationship_infiltration"
};

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
    const [minBuyers, maxBuyers] = dailyRhythm.buyerRefresh;
    const count = rng.rangeInt(minBuyers, maxBuyers);
    const buyers = [];
    const buyerTypes = Object.keys(buyerDesigns);
    const priorityPackageTypes = [
      dayPackageFocus[day],
      ...marketEvents
      .filter(event => event.day === day && event.packageType)
      .map(event => event.packageType)
    ].filter(Boolean);
    const priorityBuyerTypes = priorityPackageTypes
      .map(packageType => packageConfigs[packageType]?.buyerType)
      .filter(Boolean);
    const orderedBuyerTypes = rng.shuffle([...new Set([...priorityBuyerTypes, ...buyerTypes])]);

    for (let i = 0; i < count; i++) {
      const buyerType = orderedBuyerTypes[i % orderedBuyerTypes.length];
      const design = weightedPick(rng, buyerDesigns[buyerType]);
      const packageTypes = Object.values(packageConfigs)
        .filter(config => config.buyerType === buyerType)
        .map(config => config.packageType);
      const variance = rng.range(-0.05, 0.08);
      const customizedMultiplier = parseFloat((reputationMultiplier[design.reputation] + variance).toFixed(2));

      buyers.push({
        id: `BUYER-${day}-${i + 1}-${buyerType}-${design.reputation}`,
        templateId: `${buyerType}-${design.reputation}`,
        name: design.name,
        buyerType,
        reputation: design.reputation,
        description: describeBuyer(buyerType, design.reputation),
        allowedRecipes: packageTypes,
        allowedPackageTypes: packageTypes,
        priceMultiplier: customizedMultiplier,
        riskContribution: { ...reputationRisk[design.reputation] }
      });
    }

    return buyers;
  }
}

function weightedPick(rng, designs) {
  const total = designs.reduce((sum, design) => sum + design.rate, 0);
  let roll = rng.range(0, total);
  for (const design of designs) {
    roll -= design.rate;
    if (roll <= 0) return design;
  }
  return designs[designs.length - 1];
}

function describeBuyer(buyerType, reputation) {
  const categoryLabels = {
    advertising: "广告投放买家",
    insurance: "保险风控买家",
    recruiting: "招聘筛选买家",
    credit: "信贷评估买家",
    fraud: "匿名灰产买家"
  };
  return `${categoryLabels[buyerType] || buyerType}，信誉等级 ${reputation}。`;
}
