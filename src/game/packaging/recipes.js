/**
 * Recipe definitions for packaging privacy data.
 * Each recipe requires a unique combination of card types.
 */

export const RECIPES = [
  {
    id: "precise_profile",
    name: "精准画像包 (Precise Profile)",
    description: "精准记录用户的行踪、消费与社交关系，用于极限精准推荐。",
    requiredTypes: ["location", "consumption", "social"]
  },
  {
    id: "health_risk",
    name: "健康风险评估包 (Health Risk Assessment)",
    description: "追踪生理体征、医疗病史与消费习惯，协助保险公司合理上调保费。",
    requiredTypes: ["biometric", "health", "consumption"]
  },
  {
    id: "career_competitiveness",
    name: "职场竞争力包 (Career Competitiveness)",
    description: "通过社交人脉、消费档次和常驻行踪，评估裁员和升职概率。",
    requiredTypes: ["social", "consumption", "location"] // Same types as precise_profile
  },
  {
    id: "credit_score",
    name: "信用评分包 (Credit Score)",
    description: "消费倾向、资金关联网络与现实轨迹，完美锁定用户的偿债意愿。",
    requiredTypes: ["consumption", "contact_graph", "location"]
  },
  {
    id: "relationship_infiltration",
    name: "关系渗透包 (Relationship Infiltration)",
    description: "挖掘社交关系、人脉权重与物理位置重合度，揭示隐藏的亲密关系与地下党派。",
    requiredTypes: ["contact_graph", "social", "location"]
  }
];
