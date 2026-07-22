import {
  badges,
  challengeConfigs,
  dataCleaningConfig,
  evidenceChainTemplate,
  profilePuzzles,
  protocolScanTemplates,
  protocolTermPairs,
  publicOpinionScripts
} from "../../data/textConfig.js";
import { content } from "../content/contentBridge.js";
import { ReportDataBuilder } from "../report/ReportDataBuilder.js";

export class ChallengeService {
  static evaluateProtocolDisguise(gameState, answers) {
    const answerMap = normalizeAnswerMap(answers, "disguised");
    const correct = protocolTermPairs.filter(pair => answerMap.get(pair.id) === pair.disguised);
    const challenge = findChallenge(1);
    const passed = correct.length >= challenge.passRule.minCorrect;
    if (passed) awardBadge(gameState, challenge.badgeId);

    return {
      ok: true,
      day: 1,
      passed,
      correctCount: correct.length,
      requiredCorrect: challenge.passRule.minCorrect,
      totalAnswered: answerMap.size
    };
  }

  static evaluateDataCleaning(gameState, selectedItems) {
    const selected = new Set(normalizeList(selectedItems));
    const sensitive = new Set(dataCleaningConfig.sensitiveIcons);
    const distractors = new Set(dataCleaningConfig.distractorIcons);
    const missedSensitive = [...sensitive].filter(item => !selected.has(item));
    const wrongTaps = [...selected].filter(item => distractors.has(item));
    const challenge = findChallenge(2);
    const passed = missedSensitive.length <= challenge.passRule.maxMissedSensitive
      && wrongTaps.length <= challenge.passRule.maxWrongTap;
    if (passed) awardBadge(gameState, challenge.badgeId);

    return {
      ok: true,
      day: 2,
      passed,
      missedSensitive,
      wrongTaps,
      retryLimit: challenge.retryLimit
    };
  }

  static evaluatePublicOpinionChoice(gameState, packageType, choiceId) {
    const script = content.pickPublicOpinionScript(packageType);
    const choice = script?.choices?.find(item => item.id === choiceId);
    if (!choice) {
      return { ok: false, code: "CHOICE_NOT_FOUND", message: "Public opinion choice not found." };
    }

    const passed = !!choice.isSafeRewrite;
    if (passed) awardBadge(gameState, findChallenge(3).badgeId);
    return {
      ok: true,
      day: 3,
      passed,
      packageType,
      choice,
      safeChoiceId: script.choices.find(item => item.isSafeRewrite)?.id
    };
  }

  static evaluateProfilePuzzle(gameState, puzzleId, placements) {
    const puzzle = profilePuzzles.find(item => item.id === puzzleId) || profilePuzzles[0];
    const placementMap = normalizeAnswerMap(placements, "slot");
    const fragments = puzzle.fragments;
    const correctCount = fragments.filter(fragment => placementMap.get(fragment.id) === fragment.slot).length;
    const accuracy = fragments.length > 0 ? correctCount / fragments.length : 0;
    const scoring = findChallenge(4).scoring;
    const rank = scoring.find(item => accuracy >= item.minAccuracy) || scoring[scoring.length - 1];
    const passed = placementMap.size > 0;
    if (passed) awardBadge(gameState, findChallenge(4).badgeId);

    return {
      ok: true,
      day: 4,
      passed,
      puzzleId: puzzle.id,
      userId: puzzle.userId,
      correctCount,
      totalFragments: fragments.length,
      accuracy,
      rank: rank.rank,
      priceBonus: rank.priceBonus
    };
  }

  static evaluateBuyerNegotiation(gameState, packageType, choiceId) {
    const script = content.pickBuyerNegotiationScript(packageType);
    const choice = script.choices.find(item => item.id === choiceId) || script.choices[0];
    awardBadge(gameState, findChallenge(5).badgeId);

    return {
      ok: true,
      day: 5,
      passed: true,
      packageType,
      choice,
      dealSucceeds: true,
      blackboxFeedback: script.blackboxFeedback
    };
  }

  static evaluateProtocolScan(gameState, templateId, answers = {}) {
    const template = protocolScanTemplates.find(item => item.id === templateId) || protocolScanTemplates[0];
    const selectedClauses = new Set(normalizeList(answers.highRiskClauses));
    const selectedFlows = new Set(normalizeList(answers.dataFlowMatches));
    const correctClauses = template.highRiskClauses.filter(item => selectedClauses.has(item)).length;
    const correctFlows = template.dataFlowMatches.filter(item => selectedFlows.has(item)).length;
    const clauseScore = template.highRiskClauses.length
      ? (correctClauses / template.highRiskClauses.length) * 40
      : 40;
    const flowScore = template.dataFlowMatches.length
      ? (correctFlows / template.dataFlowMatches.length) * 40
      : 40;
    const riskScore = answers.riskAnswer === template.riskAnswer ? 20 : 0;
    const score = Math.round(clauseScore + flowScore + riskScore);
    const challenge = findChallenge(6);
    const passed = score >= challenge.passRule.minScore;
    if (passed) awardBadge(gameState, challenge.badgeId);

    return {
      ok: true,
      day: 6,
      passed,
      score,
      requiredScore: challenge.passRule.minScore,
      retryLimit: challenge.retryLimit,
      skippedIfRetryFailed: !passed && challenge.passRule.skipAfterRetry,
      template
    };
  }

  static completeEvidenceChain(gameState, links = []) {
    const route = (gameState.conscience || 0) < 5 ? "final_package" : "evidence_chain";
    gameState.endingRoute = route;

    if (route === "final_package") {
      return {
        ok: true,
        day: 7,
        route,
        completed: false,
        reason: "LOW_CONSCIENCE"
      };
    }

    const normalizedLinks = new Set(links.map(link => Array.isArray(link) ? link.join("->") : String(link)));
    const missingLinks = evidenceChainTemplate.requiredLinks.filter(link => !normalizedLinks.has(link.join("->")));
    const completed = missingLinks.length === 0;

    if (completed) {
      gameState.endingTriggered = true;
      gameState.isGameOver = true;
      gameState.gameOverReason = "SUCCESS_7_DAYS";
      gameState.ending_report = ReportDataBuilder.buildEndingReport(gameState);
    }

    return {
      ok: true,
      day: 7,
      route,
      completed,
      missingLinks,
      endingTriggered: gameState.endingTriggered
    };
  }
}

function findChallenge(day) {
  return challengeConfigs.find(item => item.day === day);
}

function awardBadge(gameState, badgeId) {
  if (!badgeId) return;
  const badge = badges.find(item => item.id === badgeId);
  if (!badge) return;
  if (!gameState.badges.some(item => item.id === badge.id)) {
    gameState.badges.push(badge);
  }
}

function normalizeAnswerMap(input, valueKey) {
  const map = new Map();
  if (Array.isArray(input)) {
    input.forEach(item => {
      if (item && item.id) {
        map.set(item.id, item[valueKey]);
      }
    });
    return map;
  }
  if (input && typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => map.set(key, value));
  }
  return map;
}

function normalizeList(input) {
  if (Array.isArray(input)) {
    return input.map(item => {
      if (item && typeof item === "object") {
        return item.label || item.name || item.id;
      }
      return item;
    });
  }
  if (input instanceof Set) return [...input];
  if (!input) return [];
  return [input];
}
