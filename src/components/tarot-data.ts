/**
 * Original Moongrove tarot collectibles — the 22 Major Arcana by name and
 * numeral, each paired with a mystical emblem (a Motif id). These are our own
 * minimal card designs (frame + numeral + name + emblem), not any existing
 * deck's artwork.
 */
export type TarotCardData = {
  id: string;
  name: string;
  num: string;
  emblem: string; // a Motif id from motif-icons
};

export const TAROT: TarotCardData[] = [
  { id: "fool", name: "The Fool", num: "0", emblem: "feather" },
  { id: "magician", name: "The Magician", num: "I", emblem: "sparkle" },
  { id: "priestess", name: "High Priestess", num: "II", emblem: "moon" },
  { id: "empress", name: "The Empress", num: "III", emblem: "leaf" },
  { id: "emperor", name: "The Emperor", num: "IV", emblem: "mountain" },
  { id: "hierophant", name: "The Hierophant", num: "V", emblem: "key" },
  { id: "lovers", name: "The Lovers", num: "VI", emblem: "heart" },
  { id: "chariot", name: "The Chariot", num: "VII", emblem: "comet" },
  { id: "strength", name: "Strength", num: "VIII", emblem: "snake" },
  { id: "hermit", name: "The Hermit", num: "IX", emblem: "flame" },
  { id: "wheel", name: "Wheel of Fortune", num: "X", emblem: "spiral" },
  { id: "justice", name: "Justice", num: "XI", emblem: "eye" },
  { id: "hanged", name: "The Hanged Man", num: "XII", emblem: "droplet" },
  { id: "death", name: "Death", num: "XIII", emblem: "crystal" },
  { id: "temperance", name: "Temperance", num: "XIV", emblem: "wave" },
  { id: "devil", name: "The Devil", num: "XV", emblem: "pentacle" },
  { id: "tower", name: "The Tower", num: "XVI", emblem: "bolt" },
  { id: "star", name: "The Star", num: "XVII", emblem: "star" },
  { id: "moon", name: "The Moon", num: "XVIII", emblem: "phases" },
  { id: "sun", name: "The Sun", num: "XIX", emblem: "sun" },
  { id: "judgement", name: "Judgement", num: "XX", emblem: "sunface" },
  { id: "world", name: "The World", num: "XXI", emblem: "cluster" },
];

const BY_ID = new Map(TAROT.map((t) => [t.id, t]));
export function tarotById(id: string): TarotCardData | undefined {
  return BY_ID.get(id);
}

/** The iconic, celestial Major Arcana — priced as the top-tier collectibles. */
export const ICONIC_TAROT = new Set(["star", "moon", "sun", "world", "wheel"]);
