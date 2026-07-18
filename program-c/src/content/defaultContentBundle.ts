import buyersData from "../../data/buyers.json";
import blackBoxLinesData from "../../data/black_box_lines.json";
import cardTemplatesData from "../../data/card_templates.json";
import dataCleaningIconsData from "../../data/data_cleaning_icons.json";
import dayChallengesData from "../../data/day_challenges.json";
import newsTemplatesData from "../../data/news_templates.json";
import packageRecipesData from "../../data/package_recipes.json";
import protocolTermsData from "../../data/protocol_terms.json";
import publicOpinionScriptsData from "../../data/public_opinion_scripts.json";
import usersData from "../../data/users.json";
import variablesData from "../../data/variables.json";
import { ContentRepository, type ContentRepositoryOptions } from "./ContentRepository";
import type {
  BlackBoxLine,
  Buyer,
  CardTemplate,
  ContentBundle,
  DataCleaningIconConfig,
  DayChallenge,
  NewsTemplate,
  PackageRecipe,
  ProtocolTerm,
  PublicOpinionScript,
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
  dataCleaningIcons: dataCleaningIconsData as readonly DataCleaningIconConfig[],
  publicOpinionScripts: publicOpinionScriptsData as readonly PublicOpinionScript[],
  blackBoxLines: blackBoxLinesData as readonly BlackBoxLine[],
};

export function createDefaultContentRepository(
  options?: ContentRepositoryOptions,
): ContentRepository {
  return new ContentRepository(defaultContentBundle, options);
}
