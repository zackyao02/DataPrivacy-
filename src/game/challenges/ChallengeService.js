import {
  badges,
  challengeConfigs,
  dataCleaningConfig,
  evidenceChainTemplate,
  profilePuzzles,
  protocolScanTemplates,
  protocolTermPairs
} from "../../data/textConfig.js";
import { content } from "../content/contentBridge.js";
import { ReportDataBuilder } from "../report/ReportDataBuilder.js";
import { ClarityService } from "../risk/ClarityService.js";

export class ChallengeService {
  static ensureDailyChallengeState(gameState, day) {
    const challenge = findChallenge(Number(day));
    if (!challenge) return null;

    const key = String(challenge.day);
    if (!gameState.challenge_history) {
      gameState.challenge_history = {};
    }

    if (!gameState.challenge_history[key]) {
      gameState.challenge_history[key] = createChallengeState(challenge);
    }

    return gameState.challenge_history[key];
  }

  static evaluateProtocolDisguise(gameState, answers) {
    const attempt = beginAttempt(gameState, 1);
    if (!attempt.ok) return attempt;

    const answerMap = normalizeAnswerMap(answers, "disguised");
    const correct = protocolTermPairs.filter(pair => answerMap.get(pair.id) === pair.disguised);
    const challenge = findChallenge(1);
    const passed = correct.length >= challenge.passRule.minCorrect;

    return finalizeAttempt(gameState, 1, {
      ok: true,
      day: 1,
      passed,
      correctCount: correct.length,
      requiredCorrect: challenge.passRule.minCorrect,
      totalAnswered: answerMap.size
    });
  }

  static evaluateDataCleaning(gameState, selectedItems) {
    const attempt = beginAttempt(gameState, 2);
    if (!attempt.ok) return attempt;

    const selected = new Set(normalizeList(selectedItems));
    const sensitive = new Set(dataCleaningConfig.sensitiveIcons);
    const distractors = new Set(dataCleaningConfig.distractorIcons);
    const missedSensitive = [...sensitive].filter(item => !selected.has(item));
    const wrongTaps = [...selected].filter(item => distractors.has(item));
    const challenge = findChallenge(2);
    const passed = missedSensitive.length <= challenge.passRule.maxMissedSensitive
      && wrongTaps.length <= challenge.passRule.maxWrongTap;

    return finalizeAttempt(gameState, 2, {
      ok: true,
      day: 2,
      passed,
      missedSensitive,
      wrongTaps,
      retryLimit: challenge.retryLimit
    });
  }

  static evaluatePublicOpinionChoice(gameState, packageType, choiceId) {
    const attempt = beginAttempt(gameState, 3);
    if (!attempt.ok) return attempt;

    const script = content.pickPublicOpinionScript(packageType);
    const choice = script?.choices?.find(item => item.id === choiceId);
    if (!choice) {
      return { ok: false, code: "CHOICE_NOT_FOUND", message: "Public opinion choice not found." };
    }

    return finalizeAttempt(gameState, 3, {
      ok: true,
      day: 3,
      passed: !!choice.isSafeRewrite,
      packageType,
      choice,
      safeChoiceId: script.choices.find(item => item.isSafeRewrite)?.id
    });
  }

  static evaluateProfilePuzzle(gameState, puzzleId, placements) {
    const attempt = beginAttempt(gameState, 4);
    if (!attempt.ok) return attempt;

    const puzzle = profilePuzzles.find(item => item.id === puzzleId) || profilePuzzles[0];
    const placementMap = normalizeAnswerMap(placements, "slot");
    const fragments = puzzle.fragments;
    const correctCount = fragments.filter(fragment => placementMap.get(fragment.id) === fragment.slot).length;
    const passed = placementMap.size > 0;

    return finalizeAttempt(gameState, 4, {
      ok: true,
      day: 4,
      passed,
      puzzleId: puzzle.id,
      userId: puzzle.userId,
      correctCount,
      totalFragments: fragments.length
    });
  }

  static evaluateBuyerNegotiation(gameState, packageType, choiceId) {
    const attempt = beginAttempt(gameState, 5);
    if (!attempt.ok) return attempt;

    const script = content.pickBuyerNegotiationScript(packageType);
    const choice = script.choices.find(item => item.id === choiceId) || script.choices[0];

    return finalizeAttempt(gameState, 5, {
      ok: true,
      day: 5,
      passed: true,
      packageType,
      choice,
      dealSucceeds: true,
      blackboxFeedback: script.blackboxFeedback
    });
  }

  static evaluateProtocolScan(gameState, templateId, answers = {}) {
    const attempt = beginAttempt(gameState, 6);
    if (!attempt.ok) return attempt;

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

    return finalizeAttempt(gameState, 6, {
      ok: true,
      day: 6,
      passed,
      score,
      requiredScore: challenge.passRule.minScore,
      retryLimit: challenge.retryLimit,
      template
    });
  }

  static completeEvidenceChain(gameState, links = []) {
    this.ensureDailyChallengeState(gameState, 7);
    const routeResult = ClarityService.resolveDay7Route(gameState);
    const route = routeResult.route;

    if (route === ClarityService.getConfig().lowRoute) {
      const state = completeChallenge(gameState, 7, {
        status: "skipped",
        skipped: true,
        skipReason: "LOW_CONSCIENCE",
        route
      });
      return {
        ok: true,
        day: 7,
        route,
        completed: false,
        reason: routeResult.reason,
        clarity: routeResult.clarity,
        threshold: routeResult.threshold,
        challengeState: state
      };
    }

    const normalizedLinks = new Set(links.map(link => Array.isArray(link) ? link.join("->") : String(link)));
    const missingLinks = evidenceChainTemplate.requiredLinks.filter(link => !normalizedLinks.has(link.join("->")));
    const completed = missingLinks.length === 0;
    let challengeState = gameState.challenge_history["7"];

    if (completed) {
      challengeState = completeChallenge(gameState, 7, {
        status: "passed",
        passed: true,
        route,
        missingLinks
      });
      gameState.endingTriggered = true;
      gameState.isGameOver = true;
      gameState.gameOverReason = "SUCCESS_7_DAYS";
      gameState.ending_report = ReportDataBuilder.buildEndingReport(gameState);
    }

    return {
      ok: true,
      day: 7,
      route,
      clarity: routeResult.clarity,
      threshold: routeResult.threshold,
      completed,
      missingLinks,
      endingTriggered: gameState.endingTriggered,
      challengeState
    };
  }
}

function findChallenge(day) {
  return challengeConfigs.find(item => item.day === day);
}

function createChallengeState(challenge) {
  const retryLimit = getRetryLimit(challenge);
  return {
    day: challenge.day,
    type: challenge.type,
    title: challenge.title,
    status: "pending",
    attempts: 0,
    retryLimit,
    maxAttempts: retryLimit + 1,
    passed: false,
    skipped: false,
    completed: false,
    badgeId: challenge.badgeId || null,
    awardedBadgeId: null,
    lastResult: null,
    startedAt: new Date().toISOString(),
    completedAt: null
  };
}

function beginAttempt(gameState, day) {
  const state = ChallengeService.ensureDailyChallengeState(gameState, day);
  if (!state) {
    return { ok: false, code: "CHALLENGE_NOT_FOUND", message: "Challenge not found." };
  }
  if (state.completed) {
    return {
      ok: false,
      code: "CHALLENGE_ALREADY_COMPLETED",
      message: "Challenge has already been completed.",
      challengeState: state
    };
  }
  if (state.attempts >= state.maxAttempts) {
    state.status = "skipped";
    state.skipped = true;
    state.completed = true;
    state.completedAt = new Date().toISOString();
    return {
      ok: false,
      code: "CHALLENGE_ATTEMPTS_EXHAUSTED",
      message: "Challenge attempts exhausted.",
      challengeState: state
    };
  }
  return { ok: true, challengeState: state };
}

function finalizeAttempt(gameState, day, result) {
  const state = ChallengeService.ensureDailyChallengeState(gameState, day);
  state.attempts += 1;
  state.lastResult = summarizeResult(result);

  if (result.passed) {
    state.status = "passed";
    state.passed = true;
    state.completed = true;
    state.completedAt = new Date().toISOString();
    state.canRetry = false;
    state.attemptsRemaining = 0;
    state.awardedBadgeId = awardBadge(gameState, state.badgeId);
  } else if (state.attempts <= state.retryLimit) {
    state.status = "failed_retry_available";
    state.canRetry = true;
    state.attemptsRemaining = state.maxAttempts - state.attempts;
  } else {
    state.status = "skipped";
    state.skipped = true;
    state.completed = true;
    state.completedAt = new Date().toISOString();
    state.canRetry = false;
    state.attemptsRemaining = 0;
  }

  gameState.activeChallenge = state;
  return {
    ...result,
    challengeState: state,
    attempts: state.attempts,
    attemptsRemaining: state.attemptsRemaining,
    canRetry: !!state.canRetry,
    skipped: !!state.skipped,
    completed: !!state.completed
  };
}

function completeChallenge(gameState, day, patch) {
  const state = ChallengeService.ensureDailyChallengeState(gameState, day);
  Object.assign(state, patch, {
    completed: true,
    completedAt: new Date().toISOString(),
    canRetry: false,
    attemptsRemaining: 0
  });
  gameState.activeChallenge = state;
  return state;
}

function getRetryLimit(challenge) {
  if (challenge.day === 7) return 0;
  return typeof challenge.retryLimit === "number" ? challenge.retryLimit : 1;
}

function awardBadge(gameState, badgeId) {
  if (!badgeId) return null;
  const badge = badges.find(item => item.id === badgeId);
  if (!badge) return null;
  if (!gameState.badges.some(item => item.id === badge.id)) {
    gameState.badges.push(badge);
  }
  return badge.id;
}

function summarizeResult(result) {
  const { template, choice, ...rest } = result;
  return {
    ...rest,
    templateId: template?.id,
    choiceId: choice?.id
  };
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
