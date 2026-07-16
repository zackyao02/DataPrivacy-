import { CardStatus } from "../data/schemas.js";

/**
 * Service to manage player workbench slots and packaged inventory.
 */
export class InventoryService {
  /**
   * Places a data card into a specific workbench slot.
   * @param {object} gameState - The current state object
   * @param {string} cardId - The ID of the card to place
   * @param {number} slotIndex - The index of the slot (0 to 3)
   * @returns {object} Action result
   */
  static placeCardToSlot(gameState, cardId, slotIndex) {
    if (slotIndex < 0 || slotIndex > 3) {
      return { ok: false, code: "INVALID_SLOT", message: "Slot index must be between 0 and 3." };
    }

    const card = gameState.rawCards.find(c => c.id === cardId);
    if (!card) {
      return { ok: false, code: "CARD_NOT_FOUND", message: "Card not found in daily pool." };
    }

    if (card.status !== CardStatus.AVAILABLE) {
      return { ok: false, code: "CARD_NOT_AVAILABLE", message: `Card is already ${card.status}.` };
    }

    // If slot is occupied, return the existing card to the available pool first
    const existingCard = gameState.workbench[slotIndex];
    if (existingCard) {
      existingCard.status = CardStatus.AVAILABLE;
    }

    // Place new card
    card.status = CardStatus.WORKBENCH;
    gameState.workbench[slotIndex] = card;

    return { ok: true, workbench: gameState.workbench };
  }

  /**
   * Removes a data card from a specific workbench slot.
   * @param {object} gameState - The current state object
   * @param {number} slotIndex - The index of the slot (0 to 3)
   * @returns {object} Action result
   */
  static removeCardFromSlot(gameState, slotIndex) {
    if (slotIndex < 0 || slotIndex > 3) {
      return { ok: false, code: "INVALID_SLOT", message: "Slot index must be between 0 and 3." };
    }

    const card = gameState.workbench[slotIndex];
    if (!card) {
      return { ok: false, code: "SLOT_EMPTY", message: "Slot is already empty." };
    }

    card.status = CardStatus.AVAILABLE;
    gameState.workbench[slotIndex] = null;

    return { ok: true, workbench: gameState.workbench };
  }

  /**
   * Adds a compiled package to inventory
   */
  static addPackage(gameState, dataPackage) {
    gameState.packageInventory.push(dataPackage);
    
    // Clear the workbench slots where these cards were
    for (let i = 0; i < gameState.workbench.length; i++) {
      const slotCard = gameState.workbench[i];
      if (slotCard && dataPackage.cardIds.includes(slotCard.id)) {
        gameState.workbench[i] = null;
      }
    }
  }

  /**
   * Removes a package from inventory (e.g., sold)
   */
  static removePackage(gameState, packageId) {
    const initialLength = gameState.packageInventory.length;
    gameState.packageInventory = gameState.packageInventory.filter(p => p.id !== packageId);
    return gameState.packageInventory.length < initialLength;
  }
}
