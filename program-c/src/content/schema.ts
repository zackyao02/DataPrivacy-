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

export const RISK_LEVELS = ["low", "medium", "high"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface CardTemplate {
  readonly id: string;
  readonly title: string;
  readonly dataType: DataType;
  readonly sensitivity: SensitivityLevel;
  readonly summary: string;
  readonly description: string;
  readonly relatedUserId: string;
  readonly userProfileTags: readonly string[];
  readonly variables?: readonly string[];
}

export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly ageRange: string;
  readonly occupation: string;
  readonly background: string;
  readonly tags: readonly string[];
  readonly newsDirection?: string;
}

export interface Buyer {
  readonly id: string;
  readonly name: string;
  readonly buyerType: string;
  readonly acceptedPackageTypes: readonly string[];
  readonly demandText: string;
  readonly reputation?: "S" | "A" | "B";
  readonly appearanceRate?: number;
}

export interface PackageRecipe {
  readonly id: string;
  readonly packageType: string;
  readonly requiredDataTypes: readonly DataType[];
  readonly description: string;
  readonly displayName?: string;
  readonly buyerType?: string;
  readonly basePrice?: number;
  readonly priceRange?: readonly number[];
  readonly newsSeverity?: number;
}

export const DAY_CHALLENGE_TYPES = [
  "protocol_match",
  "data_cleaning",
  "public_opinion",
  "profile_puzzle",
  "buyer_negotiation",
  "protocol_scan",
  "evidence_chain",
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

export interface PublicOpinionChallenge extends DayChallengeBase {
  readonly type: "public_opinion";
  readonly publicOpinionScriptIds: readonly string[];
  readonly successCondition: {
    readonly requiredSafeChoices: number;
    readonly maxRiskChoices: number;
  };
}

export interface ProfilePuzzleChallenge extends DayChallengeBase {
  readonly type: "profile_puzzle";
  readonly profilePuzzleIds: readonly string[];
}

export interface BuyerNegotiationChallenge extends DayChallengeBase {
  readonly type: "buyer_negotiation";
  readonly negotiationScriptIds: readonly string[];
}

export interface ProtocolScanChallenge extends DayChallengeBase {
  readonly type: "protocol_scan";
  readonly protocolScanTemplateIds: readonly string[];
  readonly successCondition: {
    readonly requiredRiskClauseMarks: number;
    readonly requiredDataFlowMatches: number;
    readonly requiredHiddenClauseFinds: number;
    readonly requiredRiskAnswers: number;
    readonly passingScore: number;
  };
}

export interface EvidenceChainChallenge extends DayChallengeBase {
  readonly type: "evidence_chain";
  readonly evidenceChainTemplateIds: readonly string[];
  readonly successCondition: {
    readonly requiredFragments: number;
    readonly requiredConnections: number;
    readonly requiredUpload: boolean;
  };
}

export type DayChallenge =
  | ProtocolMatchChallenge
  | DataCleaningChallenge
  | PublicOpinionChallenge
  | ProfilePuzzleChallenge
  | BuyerNegotiationChallenge
  | ProtocolScanChallenge
  | EvidenceChainChallenge;

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
  readonly 地点: readonly string[];
  readonly 话题: readonly string[];
  readonly 商品: readonly string[];
  readonly 时长: readonly string[];
  readonly 场景: readonly string[];
  readonly 数值: readonly string[];
}

export interface NewsTemplate {
  readonly id: string;
  readonly relatedPackageType: string;
  readonly headline: string;
  readonly body: string;
  readonly relatedUserIds?: readonly string[];
  readonly severity?: number;
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

export interface ProtocolScanRiskClause {
  readonly id: string;
  readonly text: string;
}

export interface ProtocolScanFlowMatch {
  readonly id: string;
  readonly source: string;
  readonly destination: string;
}

export interface ProtocolScanHiddenClause {
  readonly id: string;
  readonly text: string;
  readonly disguise: string;
}

export interface ProtocolScanRiskQuestion {
  readonly prompt: string;
  readonly answer: RiskLevel;
}

export interface ProtocolScanTemplate {
  readonly id: string;
  readonly scenario: string;
  readonly title: string;
  readonly agreementTitle: string;
  readonly riskClauses: readonly ProtocolScanRiskClause[];
  readonly dataFlowMatches: readonly ProtocolScanFlowMatch[];
  readonly hiddenClause: ProtocolScanHiddenClause;
  readonly riskQuestion: ProtocolScanRiskQuestion;
}

export type EvidenceSourceType =
  | "transaction_record"
  | "news_snapshot"
  | "black_box_instruction";

export interface EvidenceChainFragment {
  readonly id: string;
  readonly day: number;
  readonly sourceType: EvidenceSourceType;
  readonly title: string;
  readonly text: string;
  readonly linkKey: string;
}

export interface EvidenceChainConnection {
  readonly id: string;
  readonly fromFragmentId: string;
  readonly toFragmentId: string;
  readonly label: string;
  readonly rationale: string;
}

export interface EvidenceChainFinalPackage {
  readonly title: string;
  readonly description: string;
  readonly buyerName: string;
  readonly outcomeText: string;
}

export interface EvidenceChainTemplate {
  readonly id: string;
  readonly title: string;
  readonly briefing: string;
  readonly objective: string;
  readonly highAwarenessPathTitle: string;
  readonly lowAwarenessPathTitle: string;
  readonly lockedReason: string;
  readonly fragments: readonly EvidenceChainFragment[];
  readonly connections: readonly EvidenceChainConnection[];
  readonly finalPackage: EvidenceChainFinalPackage;
  readonly uploadText: string;
  readonly successText: string;
  readonly failText: string;
}

export type EndingReportPath = "final_package" | "evidence_chain";
export type EndingReportGrade = "F" | "B+";

export interface EndingReportEndingCopy {
  readonly path: EndingReportPath;
  readonly title: string;
  readonly grade: EndingReportGrade;
  readonly summary: string;
  readonly ratingComment: string;
  readonly shareText: string;
}

export interface EndingReportTemplate {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly durationText: string;
  readonly dataTypes: readonly string[];
  readonly dataUses: readonly string[];
  readonly adviceText: string;
  readonly qrPrompt: string;
  readonly sharePresets: readonly string[];
  readonly endings: readonly EndingReportEndingCopy[];
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
  | "tutorial"
  | "morning_briefing"
  | "task_instruction"
  | "process_feedback"
  | "evening_summary"
  | "general_prompt"
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
  readonly protocolScanTemplates: readonly ProtocolScanTemplate[];
  readonly evidenceChainTemplates: readonly EvidenceChainTemplate[];
  readonly endingReportTemplates: readonly EndingReportTemplate[];
  readonly dailyMonologues: readonly DailyMonologue[];
  readonly blackBoxLines: readonly BlackBoxLine[];
}
