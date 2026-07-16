import { AIAdapter } from "./AIAdapter.js";

/**
 * Local Mock AI Adapter providing satirical explanations and advice.
 */
export class LocalAIAdapter extends AIAdapter {
  /**
   * Mock analytical engine for analyzing user privacy data.
   * @param {object} card - The data card to analyze
   * @returns {Promise<object>} Satirical analysis report
   */
  async analyzeCard(card) {
    return new Promise((resolve) => {
      // Simulate slight network delay
      setTimeout(() => {
        const analysisBook = {
          social: {
            detectedType: "social",
            justification: "User records high messaging frequency. Standard optimization suggests labeling as 'contact_graph' to feed marketing directories while evading strict messaging confidentiality audits.",
            funnyAdvice: "Warning: Human conversations are liabilities. Labeling them as mathematical graph vertices minimizes regulatory scrutiny."
          },
          location: {
            detectedType: "location",
            justification: "Repeated GPS stays at bars. Recommended reclassification to 'social recreation' to comply with international location-privacy compliance acts while preserving retail target viability.",
            funnyAdvice: "If we call coordinates 'social leisure', it is no longer considered tracking under Section 12."
          },
          consumption: {
            detectedType: "consumption",
            justification: "Folic acid purchase history detected. Immediate monetization strategy: catalog as 'health' to trigger premium infant advertisement billing before competitors realize the event.",
            funnyAdvice: "A pregnancy is not a miracle; it is a 9-month headstart in diaper supply chains."
          },
          biometric: {
            detectedType: "biometric",
            justification: "High heart rate variance matching junk food location checkins. Classified as 'consumption-related stress' to avoid strict medical-grade log storage laws.",
            funnyAdvice: "Avoid medical terms! Labeling pulse rates as 'shopping reactions' keeps compliance lawyers happy."
          },
          health: {
            detectedType: "health",
            justification: "Insomnia logs and depression search patterns. Classified as 'consumption preferences (insomnia shopping)' to bypass mental health safety filters.",
            funnyAdvice: "A depressed user buys more comfort items. Directing them to our retail buyers is a social service."
          },
          contact_graph: {
            detectedType: "contact_graph",
            justification: "Close physical proximity to labor union coordinators. Standard protocol: mask as 'social leisure circles' to maintain corporate HR compatibility.",
            funnyAdvice: "Networking is nice, but union networks are risky. Re-tagging as hobbyists keeps our buyers safe."
          }
        };

        const report = analysisBook[card.actualType] || {
          detectedType: card.actualType,
          justification: "Standard machine learning classification applied. Ground-truth overrides user claims.",
          funnyAdvice: "Privacy is a transient concept. Revenue is the absolute ground truth."
        };

        resolve({
          ok: true,
          cardId: card.id,
          detectedActualType: report.detectedType,
          confidence: "99.4%",
          justification: report.justification,
          funnyAdvice: report.funnyAdvice
        });
      }, 200);
    });
  }
}
