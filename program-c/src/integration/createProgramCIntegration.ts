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
  type EndingReportPath,
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

export type ProgramCEmotionChoiceId = "sympathy" | "anger" | "numb";
export type ProgramAEmotionChoiceId = "empathy" | "anger" | "numbness";

export interface ProgramCEmotionChoice {
  readonly id: ProgramCEmotionChoiceId;
  readonly programAChoiceId: ProgramAEmotionChoiceId;
  readonly label: string;
  readonly buttonText: string;
  readonly delta: number;
  readonly feedback: readonly string[];
}

export interface ProgramCBlackboxDialogue {
  readonly day: number;
  readonly briefing?: string;
  readonly instruction?: string;
  readonly success?: string;
  readonly summary?: string;
  readonly lowBriefing?: string;
  readonly highBriefing?: string;
  readonly nagging: readonly string[];
}

export interface ProgramCTemplatePickOptions {
  readonly templateIds?: readonly string[];
  readonly rng?: unknown;
}

export type ProgramCTemplateSelector =
  | readonly string[]
  | ProgramCTemplatePickOptions;

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
  findProtocolScanTemplateById(
    templateId: string,
  ): ProtocolScanTemplate | undefined;
  findProtocolScanTemplatesByIds(
    templateIds: readonly string[],
  ): readonly ProtocolScanTemplate[];
  pickProtocolScanTemplate(
    selector?: ProgramCTemplateSelector,
  ): ProtocolScanTemplate | undefined;
  findEvidenceChainTemplateById(
    templateId: string,
  ): EvidenceChainTemplate | undefined;
  findEvidenceChainTemplatesByIds(
    templateIds: readonly string[],
  ): readonly EvidenceChainTemplate[];
  pickEvidenceChainTemplate(
    selector?: ProgramCTemplateSelector,
  ): EvidenceChainTemplate | undefined;
  findEndingReportTemplateById(
    templateId: string,
  ): EndingReportTemplate | undefined;
  pickEndingReportTemplate(
    selector?: string | ProgramCTemplatePickOptions,
  ): EndingReportTemplate | undefined;
  findEmotionChoices(): readonly ProgramCEmotionChoice[];
  findBlackboxDialogueByDay(
    day: number,
    route?: EndingReportPath | null,
  ): ProgramCBlackboxDialogue | null;
  getKnownPackageTypes(): readonly string[];
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
    packageTypes: getKnownPackageTypes(content),
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
    findProtocolScanTemplateById: (templateId: string) =>
      content.findProtocolScanTemplateById(templateId),
    findProtocolScanTemplatesByIds: (templateIds: readonly string[]) =>
      content.findProtocolScanTemplatesByIds(templateIds),
    pickProtocolScanTemplate: (selector?: ProgramCTemplateSelector) =>
      content.pickProtocolScanTemplate(resolveTemplateIds(selector)),
    findEvidenceChainTemplateById: (templateId: string) =>
      content.findEvidenceChainTemplateById(templateId),
    findEvidenceChainTemplatesByIds: (templateIds: readonly string[]) =>
      content.findEvidenceChainTemplatesByIds(templateIds),
    pickEvidenceChainTemplate: (selector?: ProgramCTemplateSelector) =>
      content.pickEvidenceChainTemplate(resolveTemplateIds(selector)),
    findEndingReportTemplateById: (templateId: string) =>
      content.findEndingReportTemplateById(templateId),
    pickEndingReportTemplate: (selector?: string | ProgramCTemplatePickOptions) =>
      pickEndingReportTemplate(content, selector),
    findEmotionChoices: () => PROGRAM_C_EMOTION_CHOICES,
    findBlackboxDialogueByDay: (
      day: number,
      route?: EndingReportPath | null,
    ) => createBlackboxDialogue(content, day, route ?? null),
    getKnownPackageTypes: () => getKnownPackageTypes(content),
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

const PROGRAM_C_EMOTION_CHOICES: readonly ProgramCEmotionChoice[] = Object.freeze([
  Object.freeze({
    id: "sympathy",
    programAChoiceId: "empathy",
    label: "同情",
    buttonText: "这不应该是数据说了算的。",
    delta: 1,
    feedback: Object.freeze([
      "那个人的脸在我脑子里挥之不去。",
      "如果那是我妈……我不敢想。",
      "一条数据背后，是一个活人。",
    ]),
  }),
  Object.freeze({
    id: "anger",
    programAChoiceId: "anger",
    label: "愤怒",
    buttonText: "我们凭什么卖掉他们的人生？",
    delta: 2,
    feedback: Object.freeze([
      "我开始觉得恶心。对黑盒，也对自己。",
      "他们连选择的权利都没有。",
      "明天，我一定要做点什么。",
    ]),
  }),
  Object.freeze({
    id: "numb",
    programAChoiceId: "numbness",
    label: "麻木",
    buttonText: "只是工作而已，与我无关。",
    delta: -1,
    feedback: Object.freeze([
      "想那么多干嘛，又不是我泄露的。",
      "转正要紧。",
      "这只是数据。一串字符而已。",
    ]),
  }),
]);

function resolveTemplateIds(
  selector?: ProgramCTemplateSelector,
): readonly string[] | undefined {
  if (!selector) {
    return undefined;
  }

  if (Array.isArray(selector)) {
    return selector as readonly string[];
  }

  return (selector as ProgramCTemplatePickOptions).templateIds;
}

function pickEndingReportTemplate(
  content: ContentRepository,
  selector?: string | ProgramCTemplatePickOptions,
): EndingReportTemplate | undefined {
  const templateId =
    typeof selector === "string" ? selector : selector?.templateIds?.[0];

  return templateId
    ? content.findEndingReportTemplateById(templateId) ??
        content.pickEndingReportTemplate()
    : content.pickEndingReportTemplate();
}

function createBlackboxDialogue(
  content: ContentRepository,
  day: number,
  route: EndingReportPath | null,
): ProgramCBlackboxDialogue | null {
  const numericDay = Number(day);

  if (!Number.isInteger(numericDay)) {
    return null;
  }

  const morningLines = content.findBlackBoxLinesForChallenge(
    numericDay,
    "morning_briefing",
  );
  const lowBriefing = morningLines[0]?.text;
  const highBriefing = morningLines[1]?.text ?? lowBriefing;
  const briefing =
    numericDay === 7 && route === "evidence_chain"
      ? highBriefing
      : lowBriefing;
  const instruction = getBlackboxText(content, numericDay, "task_instruction");
  const success =
    getBlackboxText(content, numericDay, "process_feedback") ??
    getBlackboxText(content, numericDay, "challenge_success");
  const summary = getBlackboxText(content, numericDay, "evening_summary");

  if (!briefing && !instruction && !success && !summary) {
    return null;
  }

  return Object.freeze({
    day: numericDay,
    ...(briefing ? { briefing } : {}),
    ...(instruction ? { instruction } : {}),
    ...(success ? { success } : {}),
    ...(summary ? { summary } : {}),
    ...(numericDay === 7 && lowBriefing ? { lowBriefing } : {}),
    ...(numericDay === 7 && highBriefing ? { highBriefing } : {}),
    nagging: Object.freeze(
      content
        .findBlackBoxLinesByStage("general_prompt")
        .slice(0, 4)
        .map((line) => line.text),
    ),
  });
}

function getBlackboxText(
  content: ContentRepository,
  day: number,
  stage: BlackBoxLineStage,
): string | undefined {
  return content.findBlackBoxLinesForChallenge(day, stage)[0]?.text;
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

function getKnownPackageTypes(content: ContentRepository): readonly string[] {
  return content
    .getPackageRecipes()
    .map((recipe) => recipe.packageType)
    .sort();
}

declare global {
  interface Window {
    programAIntegrations?: ProgramAIntegrationRegistry;
  }
}
