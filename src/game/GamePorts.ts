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

export type GameCommand =
  | SubmitCardToOperationPadCommand
  | PlaceCardToSlotCommand
  | RemoveCardFromSlotCommand
  | CreatePackageCommand
  | SelectPackageCommand
  | SelectBuyerCommand
  | SubmitTransactionCommand;

export const GAME_EVENT_TYPES = [
  "cardSubmittedToOperationPad",
  "packageCreated",
  "packageWasted",
  "transactionSuccess",
  "transactionFailed",
  "riskChanged",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export interface GameCommandPort {
  submitCardToOperationPad(cardId: string): void;
  placeCardToSlot(cardId: string, slotIndex: number): void;
  removeCardFromSlot(slotIndex: number): void;
  createPackage(preferredRecipeId?: string): void;
  selectPackage(packageId: string): void;
  selectBuyer(buyerId: string): void;
  submitTransaction(packageId: string, buyerId: string): void;
}
