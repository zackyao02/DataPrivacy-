import type {
  BlackBoxLine,
  BlackBoxLineStage,
  Buyer,
  BuyerNegotiationScript,
  CardTemplate,
  ContentBundle,
  DataCleaningIconConfig,
  DailyMonologue,
  DayChallenge,
  DayChallengeType,
  DataType,
  EvidenceChainTemplate,
  EndingReportTemplate,
  NewsTemplate,
  PackageRecipe,
  ProfilePuzzle,
  ProtocolTerm,
  ProtocolScanTemplate,
  PublicOpinionScript,
  SensitivityLevel,
  UserProfile,
  Variables,
} from "./schema";

export interface ContentRepositoryOptions {
  readonly random?: () => number;
}

export interface FillVariablesContext {
  readonly user?: Pick<UserProfile, "name" | "city">;
  readonly values?: Partial<Record<keyof Variables, string>>;
}

export interface PackagePreviewOptions {
  readonly onlyReady?: boolean;
}

export interface PackagePreview {
  readonly recipe: PackageRecipe;
  readonly packageType: string;
  readonly selectedCards: readonly CardTemplate[];
  readonly matchedCards: readonly CardTemplate[];
  readonly missingDataTypes: readonly DataType[];
  readonly unknownCardIds: readonly string[];
  readonly duplicateCardIds: readonly string[];
  readonly extraCardIds: readonly string[];
  readonly buyers: readonly Buyer[];
  readonly newsTemplates: readonly NewsTemplate[];
  readonly ready: boolean;
}

export class ContentRepository {
  private readonly random: () => number;

  constructor(
    private readonly bundle: ContentBundle,
    options: ContentRepositoryOptions = {},
  ) {
    this.random = options.random ?? Math.random;
  }

  getCardTemplates(): readonly CardTemplate[] {
    return this.bundle.cardTemplates;
  }

  getUsers(): readonly UserProfile[] {
    return this.bundle.users;
  }

  getBuyers(): readonly Buyer[] {
    return this.bundle.buyers;
  }

  getNewsTemplates(): readonly NewsTemplate[] {
    return this.bundle.newsTemplates;
  }

  getProtocolTerms(): readonly ProtocolTerm[] {
    return this.bundle.protocolTerms;
  }

  getPackageRecipes(): readonly PackageRecipe[] {
    return this.bundle.packageRecipes;
  }

  getDayChallenges(): readonly DayChallenge[] {
    return this.bundle.dayChallenges;
  }

  getDataCleaningIcons(): readonly DataCleaningIconConfig[] {
    return this.bundle.dataCleaningIcons;
  }

  getPublicOpinionScripts(): readonly PublicOpinionScript[] {
    return this.bundle.publicOpinionScripts;
  }

  getProfilePuzzles(): readonly ProfilePuzzle[] {
    return this.bundle.profilePuzzles;
  }

  getBuyerNegotiationScripts(): readonly BuyerNegotiationScript[] {
    return this.bundle.buyerNegotiationScripts;
  }

  getProtocolScanTemplates(): readonly ProtocolScanTemplate[] {
    return this.bundle.protocolScanTemplates;
  }

  getEvidenceChainTemplates(): readonly EvidenceChainTemplate[] {
    return this.bundle.evidenceChainTemplates;
  }

  getEndingReportTemplates(): readonly EndingReportTemplate[] {
    return this.bundle.endingReportTemplates;
  }

  getDailyMonologues(): readonly DailyMonologue[] {
    return this.bundle.dailyMonologues;
  }

  getBlackBoxLines(): readonly BlackBoxLine[] {
    return this.bundle.blackBoxLines;
  }

  findChallengeByDay(day: number): DayChallenge | undefined {
    return this.bundle.dayChallenges.find((challenge) => challenge.day === day);
  }

  findChallengesByType(type: DayChallengeType): readonly DayChallenge[] {
    return this.bundle.dayChallenges.filter((challenge) => challenge.type === type);
  }

  findDataCleaningIcon(iconHint: string): DataCleaningIconConfig | undefined {
    return this.bundle.dataCleaningIcons.find((icon) => icon.iconHint === iconHint);
  }

  findPublicOpinionScriptsForPackage(
    packageType: string,
  ): readonly PublicOpinionScript[] {
    return this.bundle.publicOpinionScripts.filter(
      (script) => script.packageType === packageType,
    );
  }

  pickPublicOpinionScript(
    packageType: string,
  ): PublicOpinionScript | undefined {
    const scripts = this.findPublicOpinionScriptsForPackage(packageType);

    if (scripts.length === 0) {
      return undefined;
    }

    return this.pick(scripts);
  }

  findProfilePuzzlesByDay(day: number): readonly ProfilePuzzle[] {
    return this.bundle.profilePuzzles.filter((puzzle) => puzzle.day === day);
  }

  findProfilePuzzleByDay(day: number): ProfilePuzzle | undefined {
    return this.findProfilePuzzlesByDay(day)[0];
  }

  pickProfilePuzzleByDay(day: number): ProfilePuzzle | undefined {
    const puzzles = this.findProfilePuzzlesByDay(day);

    if (puzzles.length === 0) {
      return undefined;
    }

    return this.pick(puzzles);
  }

  findBuyerNegotiationsByDay(day: number): readonly BuyerNegotiationScript[] {
    return this.bundle.buyerNegotiationScripts.filter((script) => script.day === day);
  }

  findBuyerNegotiationsForPackage(
    packageType: string,
  ): readonly BuyerNegotiationScript[] {
    return this.bundle.buyerNegotiationScripts.filter(
      (script) => script.packageType === packageType,
    );
  }

  pickBuyerNegotiationScript(
    packageType: string,
  ): BuyerNegotiationScript | undefined {
    const scripts = this.findBuyerNegotiationsForPackage(packageType);

    if (scripts.length === 0) {
      return undefined;
    }

    return this.pick(scripts);
  }

  findProtocolScanTemplateById(
    templateId: string,
  ): ProtocolScanTemplate | undefined {
    return this.bundle.protocolScanTemplates.find((template) => template.id === templateId);
  }

  findProtocolScanTemplatesByIds(
    templateIds: readonly string[],
  ): readonly ProtocolScanTemplate[] {
    const ids = new Set(templateIds);

    return this.bundle.protocolScanTemplates.filter((template) => ids.has(template.id));
  }

  pickProtocolScanTemplate(
    templateIds?: readonly string[],
  ): ProtocolScanTemplate | undefined {
    const templates = templateIds?.length
      ? this.findProtocolScanTemplatesByIds(templateIds)
      : this.bundle.protocolScanTemplates;

    if (templates.length === 0) {
      return undefined;
    }

    return this.pick(templates);
  }

  findEvidenceChainTemplateById(
    templateId: string,
  ): EvidenceChainTemplate | undefined {
    return this.bundle.evidenceChainTemplates.find((template) => template.id === templateId);
  }

  findEvidenceChainTemplatesByIds(
    templateIds: readonly string[],
  ): readonly EvidenceChainTemplate[] {
    const ids = new Set(templateIds);

    return this.bundle.evidenceChainTemplates.filter((template) => ids.has(template.id));
  }

  pickEvidenceChainTemplate(
    templateIds?: readonly string[],
  ): EvidenceChainTemplate | undefined {
    const templates = templateIds?.length
      ? this.findEvidenceChainTemplatesByIds(templateIds)
      : this.bundle.evidenceChainTemplates;

    if (templates.length === 0) {
      return undefined;
    }

    return this.pick(templates);
  }

  findEndingReportTemplateById(
    templateId: string,
  ): EndingReportTemplate | undefined {
    return this.bundle.endingReportTemplates.find((template) => template.id === templateId);
  }

  pickEndingReportTemplate(): EndingReportTemplate | undefined {
    if (this.bundle.endingReportTemplates.length === 0) {
      return undefined;
    }

    return this.pick(this.bundle.endingReportTemplates);
  }

  findDailyMonologueByDay(day: number): DailyMonologue | undefined {
    return this.bundle.dailyMonologues.find((monologue) => monologue.day === day);
  }

  findBlackBoxLinesByStage(stage: BlackBoxLineStage): readonly BlackBoxLine[] {
    return this.bundle.blackBoxLines.filter((line) => line.stage === stage);
  }

  findBlackBoxLinesForChallenge(
    day: number,
    stage?: BlackBoxLineStage,
  ): readonly BlackBoxLine[] {
    return this.bundle.blackBoxLines.filter(
      (line) =>
        line.relatedChallengeDay === day &&
        (!stage || line.stage === stage),
    );
  }

  findBlackBoxLinesForPackage(
    packageType: string,
    stage?: BlackBoxLineStage,
  ): readonly BlackBoxLine[] {
    return this.bundle.blackBoxLines.filter(
      (line) =>
        line.relatedPackageType === packageType &&
        (!stage || line.stage === stage),
    );
  }

  pickBlackBoxLine(
    stage: BlackBoxLineStage,
    filters: {
      readonly day?: number;
      readonly packageType?: string;
    } = {},
  ): BlackBoxLine | undefined {
    const lines = this.bundle.blackBoxLines.filter((line) => {
      if (line.stage !== stage) {
        return false;
      }

      if (filters.day !== undefined && line.relatedChallengeDay !== filters.day) {
        return false;
      }

      if (
        filters.packageType !== undefined &&
        line.relatedPackageType !== filters.packageType
      ) {
        return false;
      }

      return true;
    });

    if (lines.length === 0) {
      return undefined;
    }

    return this.pick(lines);
  }

  findRecipeByPackageType(packageType: string): PackageRecipe | undefined {
    return this.bundle.packageRecipes.find(
      (recipe) => recipe.packageType === packageType,
    );
  }

  findCardById(cardId: string): CardTemplate | undefined {
    return this.bundle.cardTemplates.find((card) => card.id === cardId);
  }

  findCardsByIds(cardIds: readonly string[]): readonly CardTemplate[] {
    const selectedCards: CardTemplate[] = [];
    const seen = new Set<string>();

    for (const cardId of cardIds) {
      if (seen.has(cardId)) {
        continue;
      }

      const card = this.findCardById(cardId);
      if (card) {
        selectedCards.push(card);
      }

      seen.add(cardId);
    }

    return selectedCards;
  }

  findRecipesForDataTypes(dataTypes: readonly DataType[]): readonly PackageRecipe[] {
    const available = new Set(dataTypes);

    return this.bundle.packageRecipes.filter((recipe) =>
      recipe.requiredDataTypes.every((dataType) => available.has(dataType)),
    );
  }

  findCardsByDataType(dataType: DataType): readonly CardTemplate[] {
    return this.bundle.cardTemplates.filter((card) => card.dataType === dataType);
  }

  findCardsBySensitivity(
    sensitivity: SensitivityLevel,
  ): readonly CardTemplate[] {
    return this.bundle.cardTemplates.filter(
      (card) => card.sensitivity === sensitivity,
    );
  }

  findBuyersForPackage(packageType: string): readonly Buyer[] {
    return this.bundle.buyers.filter((buyer) =>
      buyer.acceptedPackageTypes.includes(packageType),
    );
  }

  findNewsForPackage(packageType: string): readonly NewsTemplate[] {
    return this.bundle.newsTemplates.filter(
      (news) => news.relatedPackageType === packageType,
    );
  }

  pickNewsForPackage(packageType: string): NewsTemplate | undefined {
    const newsTemplates = this.findNewsForPackage(packageType);

    if (newsTemplates.length === 0) {
      return undefined;
    }

    return this.pick(newsTemplates);
  }

  createPackagePreview(
    packageType: string,
    cardIds: readonly string[],
  ): PackagePreview {
    const recipe = this.findRecipeByPackageType(packageType);

    if (!recipe) {
      throw new Error(`Unknown package type: ${packageType}`);
    }

    return this.createPackagePreviewForRecipe(recipe, cardIds);
  }

  findPackagePreviews(
    cardIds: readonly string[],
    options: PackagePreviewOptions = {},
  ): readonly PackagePreview[] {
    const previews = this.bundle.packageRecipes.map((recipe) =>
      this.createPackagePreviewForRecipe(recipe, cardIds),
    );

    if (options.onlyReady) {
      return previews.filter((preview) => preview.ready);
    }

    return previews;
  }

  fillVariables(
    template: string,
    context: FillVariablesContext = {},
  ): string {
    return template.replace(/\{([^}]+)\}/g, (match, rawKey: string) => {
      const key = rawKey as keyof Variables;
      const value = this.resolveVariableValue(key, context);

      return value ?? match;
    });
  }

  pickUser(): UserProfile {
    return this.pick(this.bundle.users);
  }

  pickCard(dataType?: DataType): CardTemplate {
    const source = dataType ? this.findCardsByDataType(dataType) : this.bundle.cardTemplates;
    return this.pick(source);
  }

  private pick<Item>(items: readonly Item[]): Item {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty content list.");
    }

    return items[Math.floor(this.random() * items.length)];
  }

  private createPackagePreviewForRecipe(
    recipe: PackageRecipe,
    cardIds: readonly string[],
  ): PackagePreview {
    const selectedCards = this.findCardsByIds(cardIds);
    const remainingDataTypes = this.countDataTypes(recipe.requiredDataTypes);
    const matchedCards: CardTemplate[] = [];
    const extraCardIds: string[] = [];
    const knownCardIds = new Set(this.bundle.cardTemplates.map((card) => card.id));
    const unknownCardIds = [...new Set(cardIds)].filter(
      (cardId) => !knownCardIds.has(cardId),
    );
    const duplicateCardIds = this.findDuplicateCardIds(cardIds);

    for (const card of selectedCards) {
      const remaining = remainingDataTypes.get(card.dataType) ?? 0;

      if (remaining > 0) {
        matchedCards.push(card);

        if (remaining === 1) {
          remainingDataTypes.delete(card.dataType);
        } else {
          remainingDataTypes.set(card.dataType, remaining - 1);
        }
      } else {
        extraCardIds.push(card.id);
      }
    }

    const missingDataTypes = [...remainingDataTypes.entries()].flatMap(
      ([dataType, count]) => Array.from<DataType>({ length: count }).fill(dataType),
    );
    const ready =
      missingDataTypes.length === 0 &&
      unknownCardIds.length === 0 &&
      duplicateCardIds.length === 0 &&
      extraCardIds.length === 0 &&
      selectedCards.length === recipe.requiredDataTypes.length;

    return {
      recipe,
      packageType: recipe.packageType,
      selectedCards,
      matchedCards,
      missingDataTypes,
      unknownCardIds,
      duplicateCardIds,
      extraCardIds,
      buyers: this.findBuyersForPackage(recipe.packageType),
      newsTemplates: this.findNewsForPackage(recipe.packageType),
      ready,
    };
  }

  private countDataTypes(dataTypes: readonly DataType[]): Map<DataType, number> {
    const counts = new Map<DataType, number>();

    for (const dataType of dataTypes) {
      counts.set(dataType, (counts.get(dataType) ?? 0) + 1);
    }

    return counts;
  }

  private findDuplicateCardIds(cardIds: readonly string[]): readonly string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const cardId of cardIds) {
      if (seen.has(cardId)) {
        duplicates.add(cardId);
      }

      seen.add(cardId);
    }

    return [...duplicates];
  }

  private resolveVariableValue(
    key: keyof Variables,
    context: FillVariablesContext,
  ): string | undefined {
    const directValue = context.values?.[key];

    if (directValue) {
      return directValue;
    }

    if (key === "姓名" && context.user?.name) {
      return context.user.name;
    }

    if (key === "城市" && context.user?.city) {
      return context.user.city;
    }

    const pool = this.bundle.variables[key];

    if (!pool?.length) {
      return undefined;
    }

    return pool[Math.floor(this.random() * pool.length)];
  }
}
