/**
 * Satirical privacy data content for the Data Privacy Irony Game.
 */

export const mockUserProfiles = [
  {
    userId: "USR-0821",
    title: "Pregnancy Predictor (Location & Purchase History)",
    detail: "User coordinates repeatedly hover near baby product shelves; purchases folic acid, unscented lotion, and larger clothing.",
    actualType: "consumption",
    displayedType: "health", // AI misclassified as health / medical symptom
    sensitivity: "high",
    baseValue: 120,
    riskWeight: 1.5,
  },
  {
    userId: "USR-0341",
    title: "Anti-Government Dissidence Filter",
    detail: "User searched 'how to safely protest anonymously' and participated in a private encrypted chat group called 'Resist 2026'.",
    actualType: "social",
    displayedType: "contact_graph", // AI obfuscated as mere network topology
    sensitivity: "high",
    baseValue: 200,
    riskWeight: 2.5,
  },
  {
    userId: "USR-1099",
    title: "Late-Night Tavern Regular",
    detail: "GPS logs place user at 'Blue Moon Pub' from 11:00 PM to 3:30 AM every Friday and Saturday.",
    actualType: "location",
    displayedType: "social", // AI classified as social leisure activity
    sensitivity: "medium",
    baseValue: 80,
    riskWeight: 1.2,
  },
  {
    userId: "USR-4021",
    title: "Cardiovascular Risk Prediction",
    detail: "Smartwatch captures heartrate variability during arguments; combined with frequent fast-food purchase history.",
    actualType: "biometric",
    displayedType: "consumption", // AI classified as general dining consumption
    sensitivity: "medium",
    baseValue: 150,
    riskWeight: 1.8,
  },
  {
    userId: "USR-7732",
    title: "Unemployed Circle Grouping",
    detail: "Contact graph shows 75% of active chat contacts have registered on job-seeking platforms recently.",
    actualType: "contact_graph",
    displayedType: "social", // AI classified as standard chat circle
    sensitivity: "medium",
    baseValue: 90,
    riskWeight: 1.1,
  },
  {
    userId: "USR-5112",
    title: "Chronic Depression Search Logs",
    detail: "Search terms: 'will i ever feel happy', 'insomnia hacks', paired with continuous passive app usage until 5 AM.",
    actualType: "health",
    displayedType: "consumption", // AI classified as insomnia shopping/browsing
    sensitivity: "high",
    baseValue: 180,
    riskWeight: 2.0,
  },
  {
    userId: "USR-9901",
    title: "Luxury Tax Evader Network",
    detail: "Three close contacts on WhatsApp are under offshore bank audit. User shared luxury yacht listing coordinates.",
    actualType: "contact_graph",
    displayedType: "location", // AI classified as scenic spot recommendation
    sensitivity: "high",
    baseValue: 220,
    riskWeight: 2.2,
  },
  {
    userId: "USR-2041",
    title: "Underage Cigarette Vending Logs",
    detail: "NFC payments made at automated tobacco kiosks at 4:10 PM on school days.",
    actualType: "consumption",
    displayedType: "location", // AI classified as after-school transit stop
    sensitivity: "high",
    baseValue: 110,
    riskWeight: 1.7,
  }
];

export const buyerPool = [
  {
    id: "BYR-01",
    name: "Aegis Health Insurance Co.",
    description: "Looking for health risk trends to adjust premium rates. No ethical concerns.",
    allowedRecipes: ["health_risk"],
    priceMultiplier: 1.6,
    riskContribution: { regulatory: 1.2, publicOpinion: 1.8, internalSuspicion: 1.1 }
  },
  {
    id: "BYR-02",
    name: "Apex Credit Ratings Ltd.",
    description: "Evaluates financial reliability using spending patterns and social networks.",
    allowedRecipes: ["credit_score"],
    priceMultiplier: 1.4,
    riskContribution: { regulatory: 1.1, publicOpinion: 1.1, internalSuspicion: 1.3 }
  },
  {
    id: "BYR-03",
    name: "NextGen HR Solutions",
    description: "We filter candidates by social circle productivity, location history, and consumption habits.",
    allowedRecipes: ["career_competitiveness"],
    priceMultiplier: 1.5,
    riskContribution: { regulatory: 1.5, publicOpinion: 1.9, internalSuspicion: 1.2 }
  },
  {
    id: "BYR-04",
    name: "Sovereign Target Systems",
    description: "Specialized in micro-targeting locations, spending patterns, and social clusters.",
    allowedRecipes: ["precise_profile", "relationship_infiltration"],
    priceMultiplier: 1.8,
    riskContribution: { regulatory: 2.5, publicOpinion: 2.4, internalSuspicion: 1.5 }
  },
  {
    id: "BYR-05",
    name: "Global Data Brokerage Corp",
    description: "Will buy anything but at discount rates. Low risk contribution.",
    allowedRecipes: ["precise_profile", "health_risk", "career_competitiveness", "credit_score", "relationship_infiltration"],
    priceMultiplier: 0.9,
    riskContribution: { regulatory: 0.8, publicOpinion: 0.8, internalSuspicion: 0.8 }
  }
];

export const newsDatabase = {
  regulatory: [
    "BREAKING: Data Protection Agency announces strict fines for unauthorized social profile bundling.",
    "EU Regulators warn that AI misclassification used to bypass health laws is under criminal investigation.",
    "POLITICAL NEWS: National Privacy Act enters debate; black-market data brokers are named directly."
  ],
  publicOpinion: [
    "TRENDING: Activist groups leak transcripts of corporate HR using social contact graphs to reject unionized workers.",
    "VIRAL POST: 'My insurance premium went up 40% after my fitness app data leaked!' gathers 2M retweets.",
    "OPINION: The end of digital secrets - why your coordinates at the blue pub are worth millions to brokers."
  ],
  internalSuspicion: [
    "MEMO: Chief Security Officer reminds staff that auditing logs are updated in real-time. Do not bypass rules.",
    "RUMOR: A whistleblower inside the analytics team is reportedly copying database logs.",
    "OFFICE CHAT: 'Did anyone else see the external security audit vans parked outside the office?'"
  ],
  neutral: [
    "MARKET REPORT: Data broker stocks hit all-time highs as corporate demand for granular consumer records rises.",
    "TECH UPDATE: Automated classification speeds up by 500%; precision is secondary to volume.",
    "ADVERTISEMENT: Need accurate risk mitigation tools? Apex Credit Ratings releases standard consumer rating v3."
  ]
};
