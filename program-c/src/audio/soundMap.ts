export const SOUND_EVENT_MAP = {
  dataFlowIn: "data-pulse",
  cardGenerated: "data-pulse",
  cardMovedToSlot: "slot-click",
  packageCreated: "package-seal",
  packageSealed: "package-seal",
  neonCharged: "neon-charge",
  wasteCreated: "glitch-fail",
  transactionSuccess: "coin-burst",
  transactionSealed: "transaction-seal",
  riskChanged: "risk-ping",
  newsGenerated: "crt-news",
  newsBroadcast: "news-broadcast",
  newsTicker: "news-ticker",
  emotionSelected: "emotion-select",
  emotionEmpathySelected: "emotion-empathy",
  emotionAngerSelected: "emotion-anger",
  emotionNumbnessSelected: "emotion-numbness",
  bgmBlackBox: "bgm-blackbox",
  bgmPressure: "bgm-pressure",
  bgmSilence: "bgm-silence",
  conscienceChanged: "conscience-shift",
  endingTriggered: "ending-stinger",
} as const;

export type GameSoundEventName = keyof typeof SOUND_EVENT_MAP;

export type SoundId = (typeof SOUND_EVENT_MAP)[GameSoundEventName];
