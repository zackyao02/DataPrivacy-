import type {
  Buyer,
  CardTemplate,
  ContentBundle,
  DayChallenge,
  DayChallengeType,
  DataType,
  NewsTemplate,
  PackageRecipe,
  ProtocolTerm,
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

  findChallengeByDay(day: number): DayChallenge | undefined {
    return this.bundle.dayChallenges.find((challenge) => challenge.day === day);
  }

  findChallengesByType(type: DayChallengeType): readonly DayChallenge[] {
    return this.bundle.dayChallenges.filter((challenge) => challenge.type === type);
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
    const selectedDataTypes = new Set(selectedCards.map((card) => card.dataType));
    const requiredDataTypes = new Set(recipe.requiredDataTypes);
    const matchedCards = selectedCards.filter((card) =>
      requiredDataTypes.has(card.dataType),
    );
    const missingDataTypes = recipe.requiredDataTypes.filter(
      (dataType) => !selectedDataTypes.has(dataType),
    );
    const knownCardIds = new Set(this.bundle.cardTemplates.map((card) => card.id));
    const unknownCardIds = [...new Set(cardIds)].filter(
      (cardId) => !knownCardIds.has(cardId),
    );

    return {
      recipe,
      packageType: recipe.packageType,
      selectedCards,
      matchedCards,
      missingDataTypes,
      unknownCardIds,
      buyers: this.findBuyersForPackage(recipe.packageType),
      newsTemplates: this.findNewsForPackage(recipe.packageType),
      ready: missingDataTypes.length === 0,
    };
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
