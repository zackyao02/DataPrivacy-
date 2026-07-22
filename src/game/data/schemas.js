/**
 * Schemas and Enums for Data Privacy Irony Game
 */

export const DataType = {
  SOCIAL: "social",
  LOCATION: "location",
  CONSUMPTION: "consumption",
  BIOMETRIC: "biometric",
  HEALTH: "health",
  CONTACT_GRAPH: "contact_graph"
};

export const Sensitivity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

export const CardStatus = {
  AVAILABLE: "available",   // In pool, ready for correction or packing
  WORKBENCH: "workbench",   // Placed on workbench slot
  PACKAGED: "packaged"      // Compiled into a package
};

export const PackageStatus = {
  ACTIVE: "active",
  SOLD: "sold"
};

export const WORKBENCH_SLOT_COUNT = 3;

export const EventName = {
  PACKAGE_CREATED: "packageCreated",
  WASTE_CREATED: "wasteCreated",
  TRANSACTION_SUCCESS: "transactionSuccess",
  TRANSACTION_FAILED: "transactionFailed"
};

export const PackageType = {
  PRECISE_PROFILE: "precise_profile",
  HEALTH_RISK: "health_risk",
  CAREER_COMPETITIVENESS: "career_competitiveness",
  CREDIT_SCORE: "credit_score",
  RELATIONSHIP_INFILTRATION: "relationship_infiltration",
  WASTE: "waste"
};
