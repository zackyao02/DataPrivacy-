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
