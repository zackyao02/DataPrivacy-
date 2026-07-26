import { packageConfigs } from "../../data/textConfig.js";

const recipeDescriptions = {
  precise_profile: "位置、消费与社交数据组成的精准画像，用于高压投放与价格歧视。",
  health_risk: "生物、健康与消费数据组成的健康风险评估，用于保险筛选。",
  career_competitiveness: "社交、健康与通讯录数据组成的职场竞争力评估，用于招聘筛选。",
  credit_score: "消费、社交与位置数据组成的信用评分包，用于授信与额度调整。",
  relationship_infiltration: "通讯录、社交与位置数据组成的关系渗透包，用于熟人链路攻击。"
};

/**
 * Recipe definitions for packaging privacy data.
 * These are derived from 文本配置.docx so Program B has a single numeric source.
 */
export const RECIPES = Object.values(packageConfigs).map(config => ({
  id: config.packageType,
  packageType: config.packageType,
  name: config.name,
  description: recipeDescriptions[config.packageType],
  requiredTypes: config.requiredTypes,
  buyerType: config.buyerType,
  basePrice: config.basePrice,
  priceRange: config.priceRange,
  newsSeverity: config.newsSeverity,
  dataUse: config.dataUse
}));
