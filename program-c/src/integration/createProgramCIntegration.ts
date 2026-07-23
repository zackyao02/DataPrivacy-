import {
  AudioManager,
  SOUND_EVENT_MAP,
  type AudioManagerOptions,
  type GameSoundEventName,
} from "../audio";
import {
  createDefaultContentRepository,
  type BlackBoxLine,
  type BlackBoxLineStage,
  type BuyerNegotiationScript,
  type ContentRepository,
  type ContentRepositoryOptions,
  type DataCleaningIconConfig,
  type DailyMonologue,
  type DayChallenge,
  type EvidenceChainTemplate,
  type EndingReportTemplate,
  type NewsTemplate,
  type PackagePreview,
  type PackagePreviewOptions,
  type ProfilePuzzle,
  type ProtocolScanTemplate,
  type PublicOpinionScript,
} from "../content";

export interface ProgramCContentCounts {
  readonly cardTemplates: number;
  readonly users: number;
  readonly buyers: number;
  readonly packageRecipes: number;
  readonly newsTemplates: number;
  readonly dayChallenges: number;
  readonly dataCleaningIcons: number;
  readonly publicOpinionScripts: number;
  readonly profilePuzzles: number;
  readonly buyerNegotiationScripts: number;
  readonly protocolScanTemplates: number;
  readonly evidenceChainTemplates: number;
  readonly endingReportTemplates: number;
  readonly dailyMonologues: number;
  readonly blackBoxLines: number;
  readonly audioEvents: number;
}

export interface ProgramCIntegrationSnapshot {
  readonly role: "program-c-content-audio";
  readonly counts: ProgramCContentCounts;
  readonly packageTypes: readonly string[];
  readonly playableDays: readonly number[];
  readonly audioEvents: readonly GameSoundEventName[];
}

export interface ProgramCAudioPort {
  unlock(): Promise<void>;
  handleGameEvent(eventName: GameSoundEventName | string): boolean;
  setEnabled(enabled: boolean): void;
  setMasterVolume(volume: number): void;
  destroy(): void;
}

export interface ProgramCContentDebugPort {
  getCounts(): ProgramCContentCounts;
  getSnapshot(): ProgramCIntegrationSnapshot;
  findPackagePreviews(
    cardIds: readonly string[],
    options?: PackagePreviewOptions,
  ): readonly PackagePreview[];
  pickNewsForPackage(packageType: string): NewsTemplate | undefined;
  findChallengeByDay(day: number): DayChallenge | undefined;
  findDataCleaningIcon(iconHint: string): DataCleaningIconConfig | undefined;
  pickPublicOpinionScript(packageType: string): PublicOpinionScript | undefined;
  pickProfilePuzzleByDay(day: number): ProfilePuzzle | undefined;
  pickBuyerNegotiationScript(
    packageType: string,
  ): BuyerNegotiationScript | undefined;
  pickProtocolScanTemplate(
    templateIds?: readonly string[],
  ): ProtocolScanTemplate | undefined;
  pickEvidenceChainTemplate(
    templateIds?: readonly string[],
  ): EvidenceChainTemplate | undefined;
  pickEndingReportTemplate(): EndingReportTemplate | undefined;
  findDailyMonologueByDay(day: number): DailyMonologue | undefined;
  pickBlackBoxLine(
    stage: BlackBoxLineStage,
    filters?: {
      readonly day?: number;
      readonly packageType?: string;
    },
  ): BlackBoxLine | undefined;
}

export interface ProgramCIntegration {
  readonly role: "program-c-content-audio";
  readonly version: "0.1.0";
  readonly audio: ProgramCAudioPort;
  readonly contentDebug: ProgramCContentDebugPort;
  getSnapshot(): ProgramCIntegrationSnapshot;
  destroy(): void;
}

export interface ProgramCIntegrationOptions {
  readonly content?: ContentRepository;
  readonly contentOptions?: ContentRepositoryOptions;
  readonly audio?: AudioManager;
  readonly audioOptions?: AudioManagerOptions;
}

export interface ProgramAIntegrationRegistry {
  programC?: ProgramCIntegration;
  [key: string]: unknown;
}

export interface ProgramCIntegrationTarget {
  programAIntegrations?: ProgramAIntegrationRegistry;
}

export function createProgramCIntegration(
  options: ProgramCIntegrationOptions = {},
): ProgramCIntegration {
  const content = options.content ?? createDefaultContentRepository(options.contentOptions);
  const audioManager = options.audio ?? new AudioManager(options.audioOptions);
  const ownsAudio = options.audio === undefined;

  const getSnapshot = (): ProgramCIntegrationSnapshot => ({
    role: "program-c-content-audio",
    counts: getContentCounts(content),
    packageTypes: content
      .getPackageRecipes()
      .map((recipe) => recipe.packageType)
      .sort(),
    playableDays: content
      .getDayChallenges()
      .map((challenge) => challenge.day)
      .sort((left, right) => left - right),
    audioEvents: Object.keys(SOUND_EVENT_MAP) as GameSoundEventName[],
  });

  const audio = Object.freeze({
    unlock: () => audioManager.unlock(),
    handleGameEvent: (eventName: GameSoundEventName | string) =>
      audioManager.handleGameEvent(eventName),
    setEnabled: (enabled: boolean) => audioManager.setEnabled(enabled),
    setMasterVolume: (volume: number) => audioManager.setMasterVolume(volume),
    destroy: () => {
      audioManager.destroy();
    },
  });

  const contentDebug = Object.freeze({
    getCounts: () => getContentCounts(content),
    getSnapshot,
    findPackagePreviews: (
      cardIds: readonly string[],
      previewOptions?: PackagePreviewOptions,
    ) => content.findPackagePreviews(cardIds, previewOptions),
    pickNewsForPackage: (packageType: string) =>
      content.pickNewsForPackage(packageType),
    findChallengeByDay: (day: number) => content.findChallengeByDay(day),
    findDataCleaningIcon: (iconHint: string) =>
      content.findDataCleaningIcon(iconHint),
    pickPublicOpinionScript: (packageType: string) =>
      content.pickPublicOpinionScript(packageType),
    pickProfilePuzzleByDay: (day: number) =>
      content.pickProfilePuzzleByDay(day),
    pickBuyerNegotiationScript: (packageType: string) =>
      content.pickBuyerNegotiationScript(packageType),
    pickProtocolScanTemplate: (templateIds?: readonly string[]) =>
      content.pickProtocolScanTemplate(templateIds),
    pickEvidenceChainTemplate: (templateIds?: readonly string[]) =>
      content.pickEvidenceChainTemplate(templateIds),
    pickEndingReportTemplate: () => content.pickEndingReportTemplate(),
    findDailyMonologueByDay: (day: number) =>
      content.findDailyMonologueByDay(day),
    pickBlackBoxLine: (
      stage: BlackBoxLineStage,
      filters?: {
        readonly day?: number;
        readonly packageType?: string;
      },
    ) => content.pickBlackBoxLine(stage, filters),
  });

  return Object.freeze({
    role: "program-c-content-audio",
    version: "0.1.0",
    audio,
    contentDebug,
    getSnapshot,
    destroy: () => {
      if (ownsAudio) {
        audioManager.destroy();
      }
    },
  });
}

export function installProgramCIntegration(
  target: ProgramCIntegrationTarget = globalThis as ProgramCIntegrationTarget,
  integration: ProgramCIntegration = createProgramCIntegration(),
): ProgramCIntegration {
  const registry = target.programAIntegrations ?? {};
  registry.programC = integration;
  target.programAIntegrations = registry;

  return integration;
}

function getContentCounts(content: ContentRepository): ProgramCContentCounts {
  return {
    cardTemplates: content.getCardTemplates().length,
    users: content.getUsers().length,
    buyers: content.getBuyers().length,
    packageRecipes: content.getPackageRecipes().length,
    newsTemplates: content.getNewsTemplates().length,
    dayChallenges: content.getDayChallenges().length,
    dataCleaningIcons: content.getDataCleaningIcons().length,
    publicOpinionScripts: content.getPublicOpinionScripts().length,
    profilePuzzles: content.getProfilePuzzles().length,
    buyerNegotiationScripts: content.getBuyerNegotiationScripts().length,
    protocolScanTemplates: content.getProtocolScanTemplates().length,
    evidenceChainTemplates: content.getEvidenceChainTemplates().length,
    endingReportTemplates: content.getEndingReportTemplates().length,
    dailyMonologues: content.getDailyMonologues().length,
    blackBoxLines: content.getBlackBoxLines().length,
    audioEvents: Object.keys(SOUND_EVENT_MAP).length,
  };
}

declare global {
  interface Window {
    programAIntegrations?: ProgramAIntegrationRegistry;
  }
}
