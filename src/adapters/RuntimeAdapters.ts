import type { ProgramAAdapterOptions } from "../app/ProgramACanvasApp";
import type {
  DailyChallengeResponse,
  GameEventListener,
} from "../game/GamePorts";
import type {
  ProgramBAdapterPort,
  ProgramBOperationResult,
  ProgramBStateContract,
} from "./BAdapter";
import { BAdapter } from "./BAdapter";
import { CAdapter, type CAdapterBindings } from "./CAdapter";

export interface RuntimeProgramBBindings {
  getState(): ProgramBStateContract;
  setState?(state: ProgramBStateContract): void;
  onStateChange?(
    listener: (state: Readonly<ProgramBStateContract>) => void,
  ): () => void;
  onGameEvent?(listener: GameEventListener): () => void;
  submitCardToOperationPad?(
    gameState: ProgramBStateContract,
    cardId: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  placeCardToSlot(
    gameState: ProgramBStateContract,
    cardId: string,
    slotIndex: number,
  ): ProgramBOperationResult<ProgramBStateContract>;
  removeCardFromSlot(
    gameState: ProgramBStateContract,
    slotIndex: number,
  ): ProgramBOperationResult<ProgramBStateContract>;
  createPackage(
    gameState: ProgramBStateContract,
    preferredRecipeId?: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  sellPackage(
    gameState: ProgramBStateContract,
    packageId: string,
    buyerId: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  submitDailyChallengeChoice?(
    gameState: ProgramBStateContract,
    challengeId: string,
    choiceId: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  submitDailyChallenge?(
    gameState: ProgramBStateContract,
    challengeId: string,
    response: DailyChallengeResponse,
  ): ProgramBOperationResult<ProgramBStateContract>;
  selectEmotion?(
    gameState: ProgramBStateContract,
    emotion: "empathy" | "anger" | "numbness",
  ): ProgramBOperationResult<ProgramBStateContract>;
  advanceDailyPhase?(
    gameState: ProgramBStateContract,
  ): ProgramBOperationResult<ProgramBStateContract>;
}

export interface ProgramARuntimeIntegrations {
  readonly programB?: RuntimeProgramBBindings;
  readonly programC?: CAdapterBindings;
}

export interface ProgramBNativeApi {
  placeCardToSlot(
    gameState: ProgramBStateContract,
    cardId: string,
    slotIndex: number,
  ): ProgramBOperationResult<ProgramBStateContract>;
  removeCardFromSlot(
    gameState: ProgramBStateContract,
    slotIndex: number,
  ): ProgramBOperationResult<ProgramBStateContract>;
  createPackage(
    gameState: ProgramBStateContract,
    preferredPackageType?: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  sellPackage(
    gameState: ProgramBStateContract,
    packageId: string,
    buyerId: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  applyEmotionChoice?(
    gameState: ProgramBStateContract,
    choiceId: "sympathy" | "anger" | "numb",
  ): ProgramBOperationResult<ProgramBStateContract>;
  endDay?(
    gameState: ProgramBStateContract,
  ): ProgramBOperationResult<ProgramBStateContract>;
  startDay?(
    gameState: ProgramBStateContract,
  ): ProgramBOperationResult<ProgramBStateContract>;
}

export interface ProgramBNativeFlowHooks {
  submitCardToOperationPad?(
    gameState: ProgramBStateContract,
    cardId: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  submitDailyChallengeChoice?(
    gameState: ProgramBStateContract,
    challengeId: string,
    choiceId: string,
  ): ProgramBOperationResult<ProgramBStateContract>;
  submitDailyChallenge?(
    gameState: ProgramBStateContract,
    challengeId: string,
    response: DailyChallengeResponse,
  ): ProgramBOperationResult<ProgramBStateContract>;
  advanceDailyPhase?(
    gameState: ProgramBStateContract,
  ): ProgramBOperationResult<ProgramBStateContract>;
}

export interface ProgramBNativeRegistration {
  getGameState(): ProgramBStateContract;
  readonly api: ProgramBNativeApi;
  readonly flow?: ProgramBNativeFlowHooks;
  onStateChange?(
    listener: (state: Readonly<ProgramBStateContract>) => void,
  ): () => void;
  onGameEvent?(listener: GameEventListener): () => void;
}

export type ProgramAIntegrationMode =
  | "mock"
  | "program-b"
  | "program-c"
  | "program-b+c";

export interface ProgramAIntegrationStatus {
  readonly mode: ProgramAIntegrationMode;
  readonly programBConnected: boolean;
  readonly programBMainlineReady: boolean;
  readonly programCConnected: boolean;
  readonly missingProgramBMethods: readonly string[];
  readonly warnings: readonly string[];
}

export interface RuntimeAdapterResolution {
  readonly options: ProgramAAdapterOptions;
  readonly status: ProgramAIntegrationStatus;
}

export function createProgramBNativeBindings(
  registration: ProgramBNativeRegistration,
): RuntimeProgramBBindings {
  const { api, flow } = registration;
  return {
    getState: registration.getGameState,
    onStateChange: registration.onStateChange,
    onGameEvent: registration.onGameEvent,
    placeCardToSlot: (state, cardId, slotIndex) =>
      api.placeCardToSlot(state, cardId, slotIndex),
    removeCardFromSlot: (state, slotIndex) =>
      api.removeCardFromSlot(state, slotIndex),
    createPackage: (state, preferredRecipeId) =>
      api.createPackage(state, preferredRecipeId),
    sellPackage: (state, packageId, buyerId) =>
      api.sellPackage(state, packageId, buyerId),
    ...(flow?.submitCardToOperationPad
      ? {
          submitCardToOperationPad: (state, cardId) =>
            flow.submitCardToOperationPad?.(state, cardId),
        }
      : {}),
    ...(flow?.submitDailyChallengeChoice
      ? {
          submitDailyChallengeChoice: (state, challengeId, choiceId) =>
            flow.submitDailyChallengeChoice?.(state, challengeId, choiceId),
        }
      : {}),
    ...(flow?.submitDailyChallenge
      ? {
          submitDailyChallenge: (state, challengeId, response) =>
            flow.submitDailyChallenge?.(state, challengeId, response),
        }
      : {}),
    ...(api.applyEmotionChoice
      ? {
          selectEmotion: (state, emotion) =>
            api.applyEmotionChoice?.(state, mapEmotionChoiceId(emotion)),
        }
      : {}),
    ...(flow?.advanceDailyPhase || api.endDay
      ? {
          advanceDailyPhase: (state) => {
            if (flow?.advanceDailyPhase) {
              return flow.advanceDailyPhase(state);
            }
            const endResult = api.endDay?.(state);
            if (isFailedOperation(endResult) || state.isGameOver) {
              return endResult;
            }
            return api.startDay ? api.startDay(state) : endResult;
          },
        }
      : {}),
  };
}

function isFailedOperation(
  result: ProgramBOperationResult<ProgramBStateContract>,
): boolean {
  return Boolean(
    result &&
      typeof result === "object" &&
      "ok" in result &&
      result.ok === false,
  );
}

function mapEmotionChoiceId(
  emotion: "empathy" | "anger" | "numbness",
): "sympathy" | "anger" | "numb" {
  if (emotion === "empathy") {
    return "sympathy";
  }
  return emotion === "numbness" ? "numb" : "anger";
}

const REQUIRED_B_METHODS = [
  "getState",
  "placeCardToSlot",
  "removeCardFromSlot",
  "createPackage",
  "sellPackage",
] as const;

const MAINLINE_B_METHODS = [
  "submitCardToOperationPad",
  "selectEmotion",
] as const;

export function resolveRuntimeAdapters(
  integrations: ProgramARuntimeIntegrations | undefined,
): RuntimeAdapterResolution {
  const warnings: string[] = [];
  const programBBindings = integrations?.programB;
  const missingBMethods = programBBindings
    ? REQUIRED_B_METHODS.filter(
        (method) => typeof programBBindings[method] !== "function",
      )
    : [];
  const missingMainlineBMethods: string[] = programBBindings
    ? MAINLINE_B_METHODS.filter(
        (method) => typeof programBBindings[method] !== "function",
      )
    : [...MAINLINE_B_METHODS];
  if (
    !programBBindings?.submitDailyChallenge &&
    !programBBindings?.submitDailyChallengeChoice
  ) {
    missingMainlineBMethods.push("submitDailyChallenge");
  }

  let programBConnected = false;
  let programCConnected = false;
  let bAdapter: ProgramBAdapterPort | undefined;
  let cAdapter: CAdapter | undefined;

  if (programBBindings && missingBMethods.length === 0) {
    bAdapter = new BAdapter(programBBindings);
    programBConnected = true;
    if (missingMainlineBMethods.length > 0) {
      warnings.push(
        `程序 B 核心封装/交易已连接，但每日主线仍缺方法：${missingMainlineBMethods.join(", ")}。`,
      );
    }
  } else if (programBBindings) {
    warnings.push(
      `程序 B 注入缺少方法：${missingBMethods.join(", ")}；已回退到 mock B。`,
    );
  }

  if (integrations?.programC?.audio) {
    cAdapter = new CAdapter(integrations.programC);
    programCConnected = true;
  }

  const mode: ProgramAIntegrationMode = programBConnected
    ? programCConnected
      ? "program-b+c"
      : "program-b"
    : programCConnected
      ? "program-c"
      : "mock";

  return {
    options: {
      ...(bAdapter ? { bAdapter } : {}),
      ...(cAdapter ? { cAdapter } : {}),
    },
    status: Object.freeze({
      mode,
      programBConnected,
      programBMainlineReady:
        programBConnected && missingMainlineBMethods.length === 0,
      programCConnected,
      missingProgramBMethods: Object.freeze([...missingMainlineBMethods]),
      warnings: Object.freeze(warnings),
    }),
  };
}

declare global {
  interface Window {
    programAIntegrations?: ProgramARuntimeIntegrations;
    programAIntegrationStatus?: ProgramAIntegrationStatus;
  }
}
