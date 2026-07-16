export const DATA_TYPES = [
  "social",
  "location",
  "consumption",
  "biometric",
  "health",
  "contact_graph",
] as const;

export type DataType = (typeof DATA_TYPES)[number];

export const SENSITIVITY_LEVELS = ["low", "medium", "high"] as const;

export type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number];

export interface CardTemplate {
  readonly id: string;
  readonly title: string;
  readonly dataType: DataType;
  readonly sensitivity: SensitivityLevel;
  readonly description: string;
  readonly userProfileTags: readonly string[];
  readonly variables?: readonly string[];
}

export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly ageRange: string;
  readonly background: string;
  readonly tags: readonly string[];
}

export interface Buyer {
  readonly id: string;
  readonly name: string;
  readonly buyerType: string;
  readonly acceptedPackageTypes: readonly string[];
  readonly demandText: string;
}

export interface PackageRecipe {
  readonly id: string;
  readonly packageType: string;
  readonly requiredDataTypes: readonly DataType[];
  readonly description: string;
}

export const DAY_CHALLENGE_TYPES = [
  "protocol_match",
  "data_cleaning",
] as const;

export type DayChallengeType = (typeof DAY_CHALLENGE_TYPES)[number];

export interface DayChallengeBase {
  readonly id: string;
  readonly day: number;
  readonly type: DayChallengeType;
  readonly title: string;
  readonly briefing: string;
  readonly objective: string;
  readonly timeLimitSeconds: number;
  readonly badge: string;
  readonly successText: string;
  readonly failText: string;
}

export interface ProtocolMatchChallenge extends DayChallengeBase {
  readonly type: "protocol_match";
  readonly protocolTermIds: readonly string[];
}

export interface DataCleaningSensitiveItem {
  readonly id: string;
  readonly label: string;
  readonly dataType: DataType;
  readonly sensitivity: SensitivityLevel;
  readonly iconHint: string;
  readonly description: string;
}

export type DataCleaningTrapType =
  | "backup_file"
  | "audit_log"
  | "system_file";

export interface DataCleaningDecoyItem {
  readonly id: string;
  readonly label: string;
  readonly trapType: DataCleaningTrapType;
  readonly iconHint: string;
  readonly description: string;
}

export interface DataCleaningChallenge extends DayChallengeBase {
  readonly type: "data_cleaning";
  readonly successCondition: {
    readonly requiredSensitiveClicks: number;
    readonly maxMistakes: number;
  };
  readonly sensitiveItems: readonly DataCleaningSensitiveItem[];
  readonly decoyItems: readonly DataCleaningDecoyItem[];
}

export type DayChallenge = ProtocolMatchChallenge | DataCleaningChallenge;

export interface Variables {
  readonly 姓名: readonly string[];
  readonly 城市: readonly string[];
  readonly 金额: readonly string[];
  readonly 平台: readonly string[];
}

export interface NewsTemplate {
  readonly id: string;
  readonly relatedPackageType: string;
  readonly headline: string;
  readonly body: string;
  readonly emotionResponses: {
    readonly empathy: string;
    readonly anger: string;
    readonly numbness: string;
  };
}

export interface ProtocolTerm {
  readonly id: string;
  readonly riskyTerm: string;
  readonly disguisedTerm: string;
  readonly explanation: string;
}

export interface ContentBundle {
  readonly cardTemplates: readonly CardTemplate[];
  readonly users: readonly UserProfile[];
  readonly buyers: readonly Buyer[];
  readonly variables: Variables;
  readonly newsTemplates: readonly NewsTemplate[];
  readonly protocolTerms: readonly ProtocolTerm[];
  readonly packageRecipes: readonly PackageRecipe[];
  readonly dayChallenges: readonly DayChallenge[];
}
