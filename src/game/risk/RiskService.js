/**
 * Service to process risk calculations, daily settlements, and failure triggers.
 */
export class RiskService {
  /**
   * Settles daily risk increases based on transaction history of the current day.
   * @param {object} gameState - The game state
   * @returns {object} Settlement details
   */
  static settleDailyRisk(gameState) {
    const dayTransactions = gameState.transactions.filter(tx => tx.day === gameState.day);

    let accruedRegulatory = 0;
    let accruedPublicOpinion = 0;
    let accruedInternalSuspicion = 0;

    // 1. Accumulate risk from sales
    dayTransactions.forEach(tx => {
      accruedRegulatory += tx.riskContribution.regulatory;
      accruedPublicOpinion += tx.riskContribution.publicOpinion;
      accruedInternalSuspicion += tx.riskContribution.internalSuspicion;
    });

    // 2. Satirical baseline risks
    // If no transactions were made, internal suspicion increases because management thinks you are inactive/slacking!
    if (dayTransactions.length === 0) {
      accruedInternalSuspicion += 12;
    }

    // Unsold or waste packages left in inventory create leak hazards
    gameState.packageInventory.forEach(pkg => {
      if (pkg.isWaste) {
        accruedPublicOpinion += 6; // Data waste leaks into public forums
      } else {
        accruedRegulatory += 2; // Unsecured active dossier stacks sitting around
      }
    });

    // Apply to game state
    gameState.risk.regulatory = Math.min(100, Math.max(0, parseFloat((gameState.risk.regulatory + accruedRegulatory).toFixed(2))));
    gameState.risk.publicOpinion = Math.min(100, Math.max(0, parseFloat((gameState.risk.publicOpinion + accruedPublicOpinion).toFixed(2))));
    gameState.risk.internalSuspicion = Math.min(100, Math.max(0, parseFloat((gameState.risk.internalSuspicion + accruedInternalSuspicion).toFixed(2))));

    // Determine if any limits were breached
    const breached = [];
    if (gameState.risk.regulatory >= 100) breached.push("REGULATORY_SHUTDOWN");
    if (gameState.risk.publicOpinion >= 100) breached.push("PUBLIC_LYNCHING");
    if (gameState.risk.internalSuspicion >= 100) breached.push("TERMINATION");

    return {
      ok: true,
      accrued: {
        regulatory: accruedRegulatory,
        publicOpinion: accruedPublicOpinion,
        internalSuspicion: accruedInternalSuspicion
      },
      breached,
      isGameOver: breached.length > 0
    };
  }

  /**
   * Get description of current risks
   */
  static getRiskStatus(riskState) {
    const { regulatory, publicOpinion, internalSuspicion } = riskState;
    return {
      regulatory: regulatory > 75 ? "CRITICAL: Audit imminent" : regulatory > 40 ? "WARNING: Compliance check pending" : "SAFE",
      publicOpinion: publicOpinion > 75 ? "CRITICAL: Hacker leaks viral" : publicOpinion > 40 ? "WARNING: Activists investigating" : "SAFE",
      internalSuspicion: internalSuspicion > 75 ? "CRITICAL: Log auditing started" : internalSuspicion > 40 ? "WARNING: Micro-management peak" : "SAFE"
    };
  }
}
