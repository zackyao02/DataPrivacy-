import {
  dataCardTemplates,
  dailyRhythm,
  finalEmployeeCard,
  marketEvents,
  packageConfigs,
  userProfiles
} from "../../data/textConfig.js";
import { CardStatus } from "./schemas.js";

const sensitivityColors = {
  low: "blue",
  medium: "yellow",
  high: "red"
};

const dayPackageFocus = {
  1: "precise_profile",
  2: "health_risk",
  3: "credit_score",
  4: "career_competitiveness",
  5: "health_risk",
  6: "relationship_infiltration"
};

/**
 * Factory for creating DataCard instances deterministically.
 */
export class DataCardFactory {
  /**
   * Generates a list of cards for a specific day.
   * @param {SeedRandom} rng - The seeded random generator
   * @param {number} day - The current game day (1-7)
   * @returns {Array<object>} An array of generated DataCard objects
   */
  static generateDailyCards(rng, day, gameState = {}) {
    const cardCount = dailyRhythm.cardFlow[day] || 8;
    if (Number(day) === 7) {
      return [this.createEmployeeCard(rng, day, gameState)];
    }

    const templates = pickTemplatesForDay(rng, day, cardCount);
    return templates.map((template, index) => this.createCardFromTemplate(template, rng, day, index));
  }

  static createCardFromTemplate(template, rng, day, index) {
    const profile = userProfiles.find(user => user.userId === template.userId) || null;
    const displayedType = template.displayedType || template.type;

    return {
      id: `CARD-${day}-${index + 1}-${template.cardId}-${rng.rangeInt(100, 999)}`,
      cardId: template.cardId,
      userId: template.userId,
      userName: profile?.name || template.userId,
      userProfile: profile,
      title: template.title,
      summary: template.summary,
      detail: template.detail,
      actualType: template.type,
      displayedType,
      sensitivity: template.sensitivity,
      sensitivityColor: sensitivityColors[template.sensitivity],
      baseValue: template.baseValue,
      riskWeight: template.riskWeight,
      status: CardStatus.AVAILABLE,
      isCorrected: displayedType === template.type,
      originalDisplayedType: displayedType
    };
  }

  static createEmployeeCard(rng, day, gameState) {
    const nickname = gameState.nickname || gameState.playerName || "第996号员工";
    return {
      id: `CARD-${day}-SELF-${rng.rangeInt(100, 999)}`,
      cardId: finalEmployeeCard.cardId,
      userId: "EMPLOYEE_SELF",
      userName: nickname,
      userProfile: {
        userId: "EMPLOYEE_SELF",
        name: nickname,
        tags: ["试用期员工", "行为监控", "最终商品"]
      },
      title: finalEmployeeCard.title,
      summary: finalEmployeeCard.summary,
      detail: finalEmployeeCard.detail.replace("第996号员工", nickname),
      actualType: finalEmployeeCard.type,
      displayedType: finalEmployeeCard.type,
      sensitivity: finalEmployeeCard.sensitivity,
      sensitivityColor: sensitivityColors[finalEmployeeCard.sensitivity],
      baseValue: finalEmployeeCard.baseValue,
      riskWeight: finalEmployeeCard.riskWeight,
      status: CardStatus.AVAILABLE,
      isCorrected: true,
      originalDisplayedType: finalEmployeeCard.type
    };
  }
}

function pickTemplatesForDay(rng, day, cardCount) {
  const selected = [];
  const eventFocus = marketEvents.find(event => event.day === day && event.packageType)?.packageType;
  const focusPackageType = eventFocus || dayPackageFocus[day];
  const requiredTypes = packageConfigs[focusPackageType]?.requiredTypes || [];
  const shuffled = rng.shuffle(dataCardTemplates);

  requiredTypes.forEach(type => {
    const match = shuffled.find(template => template.type === type && !selected.includes(template));
    if (match) selected.push(match);
  });

  for (const template of shuffled) {
    if (selected.length >= cardCount) break;
    if (!selected.includes(template)) selected.push(template);
  }

  return selected.slice(0, cardCount);
}
