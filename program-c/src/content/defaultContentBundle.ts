import buyersData from "../../data/buyers.json";
import buyerNegotiationScriptsData from "../../data/buyer_negotiation_scripts.json";
import blackBoxLinesData from "../../data/black_box_lines.json";
import cardTemplatesData from "../../data/card_templates.json";
import dataCleaningIconsData from "../../data/data_cleaning_icons.json";
import dailyMonologuesData from "../../data/daily_monologues.json";
import dayChallengesData from "../../data/day_challenges.json";
import newsTemplatesData from "../../data/news_templates.json";
import packageRecipesData from "../../data/package_recipes.json";
import profilePuzzlesData from "../../data/profile_puzzles.json";
import protocolTermsData from "../../data/protocol_terms.json";
import publicOpinionScriptsData from "../../data/public_opinion_scripts.json";
import usersData from "../../data/users.json";
import variablesData from "../../data/variables.json";
import { ContentRepository, type ContentRepositoryOptions } from "./ContentRepository";
import type {
  BlackBoxLine,
  Buyer,
  BuyerNegotiationScript,
  CardTemplate,
  ContentBundle,
  DataCleaningIconConfig,
  DailyMonologue,
  DayChallenge,
  NewsTemplate,
  PackageRecipe,
  ProfilePuzzle,
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
  profilePuzzles: profilePuzzlesData as readonly ProfilePuzzle[],
  buyerNegotiationScripts: buyerNegotiationScriptsData as readonly BuyerNegotiationScript[],
  dailyMonologues: dailyMonologuesData as readonly DailyMonologue[],
  blackBoxLines: blackBoxLinesData as readonly BlackBoxLine[],
};

export function createDefaultContentRepository(
  options?: ContentRepositoryOptions,
): ContentRepository {
  return new ContentRepository(defaultContentBundle, options);
}
