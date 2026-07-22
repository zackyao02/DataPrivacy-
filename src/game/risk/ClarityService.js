import { clarityConfig } from "../../data/textConfig.js";

export class ClarityService {
  static getConfig() {
    return clarityConfig;
  }

  static getValue(gameState) {
    if (typeof gameState.clarity_score === "number") {
      return this.clamp(gameState.clarity_score);
    }
    if (typeof gameState.conscience === "number") {
      return this.clamp(gameState.conscience);
    }
    return clarityConfig.initialValue;
  }

  static setValue(gameState, value) {
    const nextValue = this.clamp(value);
    gameState.clarity_score = nextValue;
    gameState.conscience = nextValue;
    return nextValue;
  }

  static addDelta(gameState, delta) {
    return this.setValue(gameState, this.getValue(gameState) + delta);
  }

  static clamp(value) {
    return Math.max(clarityConfig.min, Math.min(clarityConfig.max, Number(value) || 0));
  }

  static requiresEmotionForDay(day) {
    const numericDay = Number(day);
    return numericDay >= clarityConfig.trigger.startDay && numericDay <= clarityConfig.trigger.endDay;
  }

  static resolveDay7Route(gameState) {
    const clarity = this.getValue(gameState);
    const route = clarity < clarityConfig.endingThreshold
      ? clarityConfig.lowRoute
      : clarityConfig.highRoute;
    gameState.endingRoute = route;
    this.setValue(gameState, clarity);

    return {
      route,
      clarity,
      threshold: clarityConfig.endingThreshold,
      reason: route === clarityConfig.lowRoute ? "LOW_CLARITY" : "CLARITY_THRESHOLD_MET"
    };
  }
}
