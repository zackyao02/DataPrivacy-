export const SOUND_EVENT_MAP = {
  cardGenerated: "data-pulse",
  cardMovedToSlot: "slot-click",
  packageCreated: "package-seal",
  wasteCreated: "glitch-fail",
  transactionSuccess: "coin-burst",
  riskChanged: "risk-ping",
  newsGenerated: "crt-news",
  emotionSelected: "emotion-select",
  conscienceChanged: "conscience-shift",
  endingTriggered: "ending-stinger",
} as const;

export type GameSoundEventName = keyof typeof SOUND_EVENT_MAP;

export type SoundId = (typeof SOUND_EVENT_MAP)[GameSoundEventName];
