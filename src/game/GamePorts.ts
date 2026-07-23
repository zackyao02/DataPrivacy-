export interface SubmitCardToOperationPadCommand {
  readonly type: "submitCardToOperationPad";
  readonly cardId: string;
}

export interface PlaceCardToSlotCommand {
  readonly type: "placeCardToSlot";
  readonly cardId: string;
  readonly slotIndex: number;
}

export interface RemoveCardFromSlotCommand {
  readonly type: "removeCardFromSlot";
  readonly slotIndex: number;
}

export interface CreatePackageCommand {
  readonly type: "createPackage";
  readonly preferredRecipeId?: string;
}

export interface SelectPackageCommand {
  readonly type: "selectPackage";
  readonly packageId: string;
}

export interface SelectBuyerCommand {
  readonly type: "selectBuyer";
  readonly buyerId: string;
}

export interface SubmitTransactionCommand {
  readonly type: "submitTransaction";
  readonly packageId: string;
  readonly buyerId: string;
}

export interface SubmitDailyChallengeChoiceCommand {
  readonly type: "submitDailyChallengeChoice";
  readonly challengeId: string;
  readonly choiceId: string;
}

export interface DailyChallengeTaskAnswer {
  readonly taskId: string;
  readonly optionIds: readonly string[];
}

export interface DailyChallengeResponse {
  readonly kind:
    | "protocol-match"
    | "data-cleaning"
    | "public-opinion"
    | "profile-puzzle"
    | "buyer-negotiation"
    | "protocol-scan"
    | "final-package";
  readonly answers: readonly DailyChallengeTaskAnswer[];
  readonly context?: Readonly<Record<string, string | number | boolean>>;
}

export interface SubmitDailyChallengeCommand {
  readonly type: "submitDailyChallenge";
  readonly challengeId: string;
  readonly response: DailyChallengeResponse;
}

export interface SelectEmotionCommand {
  readonly type: "selectEmotion";
  readonly emotion: "empathy" | "anger" | "numbness";
}

export interface AdvanceDailyPhaseCommand {
  readonly type: "advanceDailyPhase";
}

export type GameCommand =
  | SubmitCardToOperationPadCommand
  | PlaceCardToSlotCommand
  | RemoveCardFromSlotCommand
  | CreatePackageCommand
  | SelectPackageCommand
  | SelectBuyerCommand
  | SubmitTransactionCommand
  | SubmitDailyChallengeChoiceCommand
  | SubmitDailyChallengeCommand
  | SelectEmotionCommand
  | AdvanceDailyPhaseCommand;

export const GAME_EVENT_TYPES = [
  "packageCreated",
  "packageSealed",
  "wasteCreated",
  "transactionSuccess",
  "transactionSealed",
  "riskChanged",
  "newsGenerated",
  "newsBroadcast",
  "cardMovedToSlot",
  "challengeSuccess",
  "challengeFail",
  "blackBoxLine",
  "emotionSelected",
  "emotionEmpathySelected",
  "emotionAngerSelected",
  "emotionNumbnessSelected",
  "clarityChanged",
  "conscienceChanged",
  "endingTriggered",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export const LEGACY_GAME_EVENT_TYPES = [
  "cardSubmittedToOperationPad",
  "packageChoiceRequired",
  "packageWasted",
  "transactionFailed",
] as const;

export type LegacyGameEventType = (typeof LEGACY_GAME_EVENT_TYPES)[number];
export type ProgramAFeedbackEventType = GameEventType | LegacyGameEventType;

export interface GameEvent {
  readonly type: string;
  readonly payload?: unknown;
  readonly timestamp: number;
}

export type GameEventListener = (event: GameEvent) => void;

export interface GameEventPort {
  onGameEvent(listener: GameEventListener): () => void;
}

export interface GameCommandPort {
  submitCardToOperationPad(cardId: string): void;
  placeCardToSlot(cardId: string, slotIndex: number): void;
  removeCardFromSlot(slotIndex: number): void;
  createPackage(preferredRecipeId?: string): void;
  selectPackage(packageId: string): void;
  selectBuyer(buyerId: string): void;
  submitTransaction(packageId: string, buyerId: string): void;
  submitDailyChallengeChoice(challengeId: string, choiceId: string): void;
  submitDailyChallenge(
    challengeId: string,
    response: DailyChallengeResponse,
  ): void;
  selectEmotion(emotion: "empathy" | "anger" | "numbness"): void;
  advanceDailyPhase(): void;
}

export interface GameStatePort {
  getVisibleState(): Readonly<VisibleGameState>;
  onVisibleStateChange(
    listener: (state: Readonly<VisibleGameState>) => void,
  ): () => void;
}

export interface AudioPort {
  handleGameEvent(eventName: string): boolean | void;
  unlock?(): Promise<void> | void;
}

export function isGameEventType(value: string): value is GameEventType {
  return (GAME_EVENT_TYPES as readonly string[]).includes(value);
}
import type { VisibleGameState } from "./VisibleGameState";
