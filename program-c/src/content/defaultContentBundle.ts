import buyersData from "../../data/buyers.json";
import cardTemplatesData from "../../data/card_templates.json";
import dayChallengesData from "../../data/day_challenges.json";
import newsTemplatesData from "../../data/news_templates.json";
import packageRecipesData from "../../data/package_recipes.json";
import protocolTermsData from "../../data/protocol_terms.json";
import usersData from "../../data/users.json";
import variablesData from "../../data/variables.json";
import { ContentRepository, type ContentRepositoryOptions } from "./ContentRepository";
import type {
  Buyer,
  CardTemplate,
  ContentBundle,
  DayChallenge,
  NewsTemplate,
  PackageRecipe,
  ProtocolTerm,
  UserProfile,
  Variables,
} from "./schema";

export const defaultContentBundle: ContentBundle = {
  cardTemplates: cardTemplatesData as readonly CardTemplate[],
  users: usersData as readonly UserProfile[],
  buyers: buyersData as readonly Buyer[],
  variables: variablesData as Variables,
  newsTemplates: newsTemplatesData as readonly NewsTemplate[],
  protocolTerms: protocolTermsData as readonly ProtocolTerm[],
  packageRecipes: packageRecipesData as readonly PackageRecipe[],
  dayChallenges: dayChallengesData as readonly DayChallenge[],
};

export function createDefaultContentRepository(
  options?: ContentRepositoryOptions,
): ContentRepository {
  return new ContentRepository(defaultContentBundle, options);
}
