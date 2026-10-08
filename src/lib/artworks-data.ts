export type Artwork = {
  id: number;
  work: string;
  artist: string;
  year: string;
  /**
   * A public-domain image of the work, hotlinked from Wikimedia Commons.
   * Omitted for works still under copyright, which fall back to a text placard.
   */
  image?: string;
};

/** Price of any artwork, in stamps. */
export const ARTWORK_COST = 10;

/**
 * The 50 most famous artworks. Shown three-at-a-time as daily picks you can buy
 * with stamps, then hung in your gallery. Public-domain works carry an `image`
 * (hotlinked from Wikimedia Commons); works still under copyright have no image
 * and show a museum-placard card instead.
 */
export const ARTWORKS: Artwork[] = [
  { id: 1, work: "Mona Lisa", artist: "Leonardo da Vinci", year: "c.1503", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa.jpg?width=600" },
  { id: 2, work: "The Starry Night", artist: "Vincent van Gogh", year: "1889", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=600" },
  { id: 3, work: "The Last Supper", artist: "Leonardo da Vinci", year: "c.1495-98", image: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Last_Supper_-_Leonardo_Da_Vinci_-_High_Resolution_32x16.jpg?width=600" },
  { id: 4, work: "The Scream", artist: "Edvard Munch", year: "1893", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg?width=600" },
  { id: 5, work: "Girl with a Pearl Earring", artist: "Johannes Vermeer", year: "c.1665", image: "https://commons.wikimedia.org/wiki/Special:FilePath/1665_Girl_with_a_Pearl_Earring.jpg?width=600" },
  { id: 6, work: "Creation of Adam", artist: "Michelangelo", year: "1508-12", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg?width=600" },
  { id: 7, work: "Guernica", artist: "Pablo Picasso", year: "1937" },
  { id: 8, work: "The Birth of Venus", artist: "Sandro Botticelli", year: "c.1485", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg?width=600" },
  { id: 9, work: "David", artist: "Michelangelo", year: "1501-04", image: "https://commons.wikimedia.org/wiki/Special:FilePath/%27David%27_by_Michelangelo_Fir_JBU004.jpg?width=600" },
  { id: 10, work: "The Night Watch", artist: "Rembrandt van Rijn", year: "1642", image: "https://commons.wikimedia.org/wiki/Special:FilePath/La_ronda_de_noche%2C_por_Rembrandt_van_Rijn.jpg?width=600" },
  { id: 11, work: "Venus de Milo", artist: "Unknown (Ancient Greek)", year: "c.130 BCE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Front_views_of_the_Venus_de_Milo.jpg?width=600" },
  { id: 12, work: "Winged Victory of Samothrace", artist: "Unknown", year: "c.190 BCE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Victoire_de_Samothrace_-_Musee_du_Louvre_-_20190812.jpg?width=600" },
  { id: 13, work: "Las Meninas", artist: "Diego Velazquez", year: "1656", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg?width=600" },
  { id: 14, work: "American Gothic", artist: "Grant Wood", year: "1930", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Grant_Wood_-_American_Gothic_%281930%29.jpg?width=600" },
  { id: 15, work: "The Great Wave off Kanagawa", artist: "Katsushika Hokusai", year: "c.1831", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tsunami_by_hokusai_19th_century.jpg?width=600" },
  { id: 16, work: "The Kiss", artist: "Gustav Klimt", year: "1907-08", image: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg?width=600" },
  { id: 17, work: "The Persistence of Memory", artist: "Salvador Dali", year: "1931" },
  { id: 18, work: "Water Lilies", artist: "Claude Monet", year: "1896-1926", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Reflections_of_Clouds_on_the_Water-Lily_Pond.jpg?width=600" },
  { id: 19, work: "Whistler's Mother", artist: "James McNeill Whistler", year: "1871", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Whistlers_Mother_high_res.jpg?width=600" },
  { id: 20, work: "The Garden of Earthly Delights", artist: "Hieronymus Bosch", year: "c.1500-10", image: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Garden_of_earthly_delights.jpg?width=600" },
  { id: 21, work: "Liberty Leading the People", artist: "Eugene Delacroix", year: "1830", image: "https://commons.wikimedia.org/wiki/Special:FilePath/La_Libert%C3%A9_guidant_le_peuple_-_Eug%C3%A8ne_Delacroix_-_Mus%C3%A9e_du_Louvre_Peintures_RF_129_-_apr%C3%A8s_restauration_2024.jpg?width=600" },
  { id: 22, work: "The Raft of the Medusa", artist: "Theodore Gericault", year: "1818-19", image: "https://commons.wikimedia.org/wiki/Special:FilePath/JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg?width=600" },
  { id: 23, work: "The Arnolfini Portrait", artist: "Jan van Eyck", year: "1434", image: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Arnolfini_portrait_%281434%29.jpg?width=600" },
  { id: 24, work: "Impression, Sunrise", artist: "Claude Monet", year: "1872", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Monet_-_Impression%2C_Sunrise.jpg?width=600" },
  { id: 25, work: "The Third of May 1808", artist: "Francisco de Goya", year: "1814", image: "https://commons.wikimedia.org/wiki/Special:FilePath/El_Tres_de_Mayo%2C_by_Francisco_de_Goya%2C_from_Prado_thin_black_margin.jpg?width=600" },
  { id: 26, work: "A Sunday Afternoon on La Grande Jatte", artist: "Georges Seurat", year: "1884-86", image: "https://commons.wikimedia.org/wiki/Special:FilePath/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg?width=600" },
  { id: 27, work: "Les Demoiselles d'Avignon", artist: "Pablo Picasso", year: "1907" },
  { id: 28, work: "The School of Athens", artist: "Raphael", year: "1509-11", image: "https://commons.wikimedia.org/wiki/Special:FilePath/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg?width=600" },
  { id: 29, work: "Nighthawks", artist: "Edward Hopper", year: "1942" },
  { id: 30, work: "Whistlejacket", artist: "George Stubbs", year: "1762", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Whistlejacket_by_George_Stubbs_edit.jpg?width=600" },
  { id: 31, work: "Christina's World", artist: "Andrew Wyeth", year: "1948" },
  { id: 32, work: "Campbell's Soup Cans", artist: "Andy Warhol", year: "1962" },
  { id: 33, work: "No. 5, 1948", artist: "Jackson Pollock", year: "1948" },
  { id: 34, work: "Pieta", artist: "Michelangelo", year: "1498-99", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieta_de_Michelangelo_-_Vaticano.jpg?width=600" },
  { id: 35, work: "The Thinker", artist: "Auguste Rodin", year: "1904", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Le_Penseur_by_Rodin_%28Kunsthalle_Bielefeld%29_2014-04-10.JPG?width=600" },
  { id: 36, work: "Discobolus", artist: "Myron", year: "c.460-450 BCE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Roman_bronze_copy_of_Myron%E2%80%99s_Discobolos%2C_2nd_century_CE_%28Glyptothek_Munich%29.jpg?width=600" },
  { id: 37, work: "Terracotta Army", artist: "Unknown craftsmen", year: "210 BCE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/51714-Terracota-Army.jpg?width=600" },
  { id: 38, work: "Bust of Nefertiti", artist: "Thutmose", year: "c.1345 BCE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Nofretete_Neues_Museum.jpg?width=600" },
  { id: 39, work: "Laocoon and His Sons", artist: "Agesander & others", year: "1st C. BCE/CE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Laoco%C3%B6n_and_his_sons_group.jpg?width=600" },
  { id: 40, work: "Sunflowers", artist: "Vincent van Gogh", year: "1888", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Vincent_Willem_van_Gogh_127.jpg?width=600" },
  { id: 41, work: "Composition VIII", artist: "Wassily Kandinsky", year: "1923" },
  { id: 42, work: "The Anatomy Lesson of Dr. Tulp", artist: "Rembrandt van Rijn", year: "1632", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg?width=600" },
  { id: 43, work: "Napoleon Crossing the Alps", artist: "Jacques-Louis David", year: "1801-05", image: "https://commons.wikimedia.org/wiki/Special:FilePath/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg?width=600" },
  { id: 44, work: "The Swing", artist: "Jean-Honore Fragonard", year: "1767", image: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Swing_%28P430%29.jpg?width=600" },
  { id: 45, work: "Whaam!", artist: "Roy Lichtenstein", year: "1963" },
  { id: 46, work: "Marilyn Diptych", artist: "Andy Warhol", year: "1962" },
  { id: 47, work: "The Hay Wain", artist: "John Constable", year: "1821", image: "https://commons.wikimedia.org/wiki/Special:FilePath/John_Constable_-_The_Hay_Wain_%281821%29.jpg?width=600" },
  { id: 48, work: "Statue of Liberty", artist: "Frederic Auguste Bartholdi", year: "1886", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Front_view_of_Statue_of_Liberty_%28cropped%29.jpg?width=600" },
  { id: 49, work: "Christ the Redeemer", artist: "Paul Landowski", year: "1931" },
  { id: 50, work: "Venus of Willendorf", artist: "Unknown (Prehistoric)", year: "c.25,000 BCE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Venus_von_Willendorf_01.jpg?width=600" },
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
