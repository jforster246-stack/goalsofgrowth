export type Artwork = {
  id: number;
  work: string;
  artist: string;
  year: string;
};

/** Price of any artwork, in stamps. */
export const ARTWORK_COST = 20;

/**
 * The 50 most famous artworks. Shown three-at-a-time as daily picks you can buy
 * with stamps, then hung in your gallery as museum placards (we don't ship the
 * images - many are still under copyright).
 */
export const ARTWORKS: Artwork[] = [
  { id: 1, work: "Mona Lisa", artist: "Leonardo da Vinci", year: "c.1503" },
  { id: 2, work: "The Starry Night", artist: "Vincent van Gogh", year: "1889" },
  { id: 3, work: "The Last Supper", artist: "Leonardo da Vinci", year: "c.1495-98" },
  { id: 4, work: "The Scream", artist: "Edvard Munch", year: "1893" },
  { id: 5, work: "Girl with a Pearl Earring", artist: "Johannes Vermeer", year: "c.1665" },
  { id: 6, work: "Creation of Adam", artist: "Michelangelo", year: "1508-12" },
  { id: 7, work: "Guernica", artist: "Pablo Picasso", year: "1937" },
  { id: 8, work: "The Birth of Venus", artist: "Sandro Botticelli", year: "c.1485" },
  { id: 9, work: "David", artist: "Michelangelo", year: "1501-04" },
  { id: 10, work: "The Night Watch", artist: "Rembrandt van Rijn", year: "1642" },
  { id: 11, work: "Venus de Milo", artist: "Unknown (Ancient Greek)", year: "c.130 BCE" },
  { id: 12, work: "Winged Victory of Samothrace", artist: "Unknown", year: "c.190 BCE" },
  { id: 13, work: "Las Meninas", artist: "Diego Velazquez", year: "1656" },
  { id: 14, work: "American Gothic", artist: "Grant Wood", year: "1930" },
  { id: 15, work: "The Great Wave off Kanagawa", artist: "Katsushika Hokusai", year: "c.1831" },
  { id: 16, work: "The Kiss", artist: "Gustav Klimt", year: "1907-08" },
  { id: 17, work: "The Persistence of Memory", artist: "Salvador Dali", year: "1931" },
  { id: 18, work: "Water Lilies", artist: "Claude Monet", year: "1896-1926" },
  { id: 19, work: "Whistler's Mother", artist: "James McNeill Whistler", year: "1871" },
  { id: 20, work: "The Garden of Earthly Delights", artist: "Hieronymus Bosch", year: "c.1500-10" },
  { id: 21, work: "Liberty Leading the People", artist: "Eugene Delacroix", year: "1830" },
  { id: 22, work: "The Raft of the Medusa", artist: "Theodore Gericault", year: "1818-19" },
  { id: 23, work: "The Arnolfini Portrait", artist: "Jan van Eyck", year: "1434" },
  { id: 24, work: "Impression, Sunrise", artist: "Claude Monet", year: "1872" },
  { id: 25, work: "The Third of May 1808", artist: "Francisco de Goya", year: "1814" },
  { id: 26, work: "A Sunday Afternoon on La Grande Jatte", artist: "Georges Seurat", year: "1884-86" },
  { id: 27, work: "Les Demoiselles d'Avignon", artist: "Pablo Picasso", year: "1907" },
  { id: 28, work: "The School of Athens", artist: "Raphael", year: "1509-11" },
  { id: 29, work: "Nighthawks", artist: "Edward Hopper", year: "1942" },
  { id: 30, work: "Whistlejacket", artist: "George Stubbs", year: "1762" },
  { id: 31, work: "Christina's World", artist: "Andrew Wyeth", year: "1948" },
  { id: 32, work: "Campbell's Soup Cans", artist: "Andy Warhol", year: "1962" },
  { id: 33, work: "No. 5, 1948", artist: "Jackson Pollock", year: "1948" },
  { id: 34, work: "Pieta", artist: "Michelangelo", year: "1498-99" },
  { id: 35, work: "The Thinker", artist: "Auguste Rodin", year: "1904" },
  { id: 36, work: "Discobolus", artist: "Myron", year: "c.460-450 BCE" },
  { id: 37, work: "Terracotta Army", artist: "Unknown craftsmen", year: "210 BCE" },
  { id: 38, work: "Bust of Nefertiti", artist: "Thutmose", year: "c.1345 BCE" },
  { id: 39, work: "Laocoon and His Sons", artist: "Agesander & others", year: "1st C. BCE/CE" },
  { id: 40, work: "Sunflowers", artist: "Vincent van Gogh", year: "1888" },
  { id: 41, work: "Composition VIII", artist: "Wassily Kandinsky", year: "1923" },
  { id: 42, work: "The Anatomy Lesson of Dr. Tulp", artist: "Rembrandt van Rijn", year: "1632" },
  { id: 43, work: "Napoleon Crossing the Alps", artist: "Jacques-Louis David", year: "1801-05" },
  { id: 44, work: "The Swing", artist: "Jean-Honore Fragonard", year: "1767" },
  { id: 45, work: "Whaam!", artist: "Roy Lichtenstein", year: "1963" },
  { id: 46, work: "Marilyn Diptych", artist: "Andy Warhol", year: "1962" },
  { id: 47, work: "The Hay Wain", artist: "John Constable", year: "1821" },
  { id: 48, work: "Statue of Liberty", artist: "Frederic Auguste Bartholdi", year: "1886" },
  { id: 49, work: "Christ the Redeemer", artist: "Paul Landowski", year: "1931" },
  { id: 50, work: "Venus of Willendorf", artist: "Unknown (Prehistoric)", year: "c.25,000 BCE" },
];

const BY_ID = new Map(ARTWORKS.map((a) => [a.id, a]));
export function artworkById(id: number): Artwork | undefined {
  return BY_ID.get(id);
}

/** Soft placard background per artwork, so the wall reads as varied canvases. */
const PLACARD_TINTS = [
  "#e7d9c4",
  "#dfe3d2",
  "#e8d3d0",
  "#d8dde3",
  "#ece0cf",
  "#dcdcc9",
];
export function artworkTint(id: number): string {
  return PLACARD_TINTS[id % PLACARD_TINTS.length] ?? PLACARD_TINTS[0]!;
}

/**
 * The three artworks offered today, chosen deterministically from the local
 * date so everyone's picks are stable for the day and rotate over time.
 */
export function dailyArtworkIds(today: string): number[] {
  const dayIndex = Math.floor(
    new Date(`${today}T00:00:00`).getTime() / 86_400_000,
  );
  const n = ARTWORKS.length;
  // Step by a value coprime with 50 so the trio walks the whole list over time.
  const step = 3;
  const base = ((dayIndex * step) % n + n) % n;
  return [0, 17, 34].map((offset) => {
    const idx = (base + offset) % n;
    return ARTWORKS[idx]!.id;
  });
}
