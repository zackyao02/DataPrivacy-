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
  "profile_puzzle",
  "buyer_negotiation",
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

export interface ProfilePuzzleChallenge extends DayChallengeBase {
  readonly type: "profile_puzzle";
  readonly profilePuzzleIds: readonly string[];
}

export interface BuyerNegotiationChallenge extends DayChallengeBase {
  readonly type: "buyer_negotiation";
  readonly negotiationScriptIds: readonly string[];
}

export type DayChallenge =
  | ProtocolMatchChallenge
  | DataCleaningChallenge
  | ProfilePuzzleChallenge
  | BuyerNegotiationChallenge;

export type DataCleaningIconRole = "sensitive" | "decoy";

export type DataCleaningIconRiskColor = "red" | "orange" | "blue";

export interface DataCleaningIconConfig {
  readonly id: string;
  readonly iconHint: string;
  readonly lucideIcon: string;
  readonly role: DataCleaningIconRole;
  readonly shortLabel: string;
  readonly riskColor: DataCleaningIconRiskColor;
  readonly scanText: string;
  readonly hitText: string;
}

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

export interface PublicOpinionTactic {
  readonly id: string;
  readonly label: string;
  readonly line: string;
  readonly playerPrompt: string;
}

export interface PublicOpinionScript {
  readonly id: string;
  readonly packageType: string;
  readonly platform: string;
  readonly scenario: string;
  readonly manipulationGoal: string;
  readonly openingLine: string;
  readonly tactics: readonly PublicOpinionTactic[];
  readonly counterCue: string;
  readonly consciencePrompt: string;
}

export type ProfilePuzzleSlot =
  | "routine"
  | "pressure"
  | "relation"
  | "risk_hint"
  | "cover_story"
  | "decoy";

export interface ProfilePuzzleFragment {
  readonly id: string;
  readonly label: string;
  readonly dataType: DataType;
  readonly sourceCardId?: string;
  readonly slot: ProfilePuzzleSlot;
  readonly text: string;
  readonly correctOrder: number;
  readonly decoy: boolean;
}

export interface ProfilePuzzle {
  readonly id: string;
  readonly day: number;
  readonly title: string;
  readonly userAlias: string;
  readonly briefing: string;
  readonly objective: string;
  readonly targetProfile: string;
  readonly badge: string;
  readonly fragments: readonly ProfilePuzzleFragment[];
  readonly successText: string;
  readonly failText: string;
}

export type BuyerNegotiationTone =
  | "aggressive"
  | "cooperative"
  | "neutral";

export interface BuyerNegotiationOption {
  readonly id: string;
  readonly label: string;
  readonly tone: BuyerNegotiationTone;
  readonly playerLine: string;
  readonly buyerReply: string;
  readonly blackBoxResponse: string;
  readonly outcomeText: string;
}

export interface BuyerNegotiationScript {
  readonly id: string;
  readonly day: number;
  readonly packageType: string;
  readonly buyerType: string;
  readonly scenario: string;
  readonly briefing: string;
  readonly resolutionRule: "both_options_succeed_narrative_only";
  readonly options: readonly BuyerNegotiationOption[];
  readonly successText: string;
}

export interface DailyMonologue {
  readonly id: string;
  readonly day: number;
  readonly trigger: "after_news";
  readonly title: string;
  readonly speaker: string;
  readonly typewriterSoundEvent: string;
  readonly textSegments: readonly string[];
  readonly closingCue: string;
}

export type BlackBoxLineStage =
  | "challenge_intro"
  | "challenge_success"
  | "challenge_fail"
  | "package_review"
  | "public_opinion"
  | "transaction_success"
  | "ending_pressure";

export interface BlackBoxLine {
  readonly id: string;
  readonly stage: BlackBoxLineStage;
  readonly cueEventName: string;
  readonly relatedChallengeDay?: number;
  readonly relatedPackageType?: string;
  readonly voiceHint: string;
  readonly text: string;
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
  readonly dataCleaningIcons: readonly DataCleaningIconConfig[];
  readonly publicOpinionScripts: readonly PublicOpinionScript[];
  readonly profilePuzzles: readonly ProfilePuzzle[];
  readonly buyerNegotiationScripts: readonly BuyerNegotiationScript[];
  readonly dailyMonologues: readonly DailyMonologue[];
  readonly blackBoxLines: readonly BlackBoxLine[];
}
