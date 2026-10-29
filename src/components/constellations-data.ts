/**
 * Moongrove constellation icon set — the 12 zodiac signs plus the most
 * recognisable constellations, each as a star-line asterism (star positions in a
 * 0–100 box, with line connections). Rendered by <Motif> in motif-icons.tsx.
 * Layouts are stylised to read at a glance, not astronomically exact.
 */
export type Constellation = {
  id: string;
  name: string;
  stars: [number, number][];
  lines: [number, number][];
};

export const CONSTELLATION_DATA: Constellation[] = [
  // ---- Zodiac ----
  {
    id: "ari",
    name: "Aries",
    stars: [[18, 58], [40, 50], [66, 44], [80, 54]],
    lines: [[0, 1], [1, 2], [2, 3]],
  },
  {
    id: "tau",
    name: "Taurus",
    stars: [[26, 34], [40, 46], [52, 56], [64, 46], [80, 30]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: "gem",
    name: "Gemini",
    stars: [[34, 20], [54, 20], [33, 40], [53, 42], [31, 60], [51, 62], [34, 78], [56, 78]],
    lines: [[0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7], [0, 1]],
  },
  {
    id: "cnc",
    name: "Cancer",
    stars: [[50, 26], [48, 50], [30, 66], [68, 64]],
    lines: [[0, 1], [1, 2], [1, 3]],
  },
  {
    id: "leo",
    name: "Leo",
    stars: [[26, 66], [27, 54], [31, 43], [41, 35], [52, 36], [47, 48], [72, 50], [58, 62]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [0, 7], [7, 6], [6, 4]],
  },
  {
    id: "vir",
    name: "Virgo",
    stars: [[28, 30], [42, 40], [52, 50], [58, 70], [72, 46], [82, 34]],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]],
  },
  {
    id: "lib",
    name: "Libra",
    stars: [[34, 42], [64, 38], [48, 54], [28, 62], [70, 60]],
    lines: [[0, 2], [2, 1], [0, 3], [1, 4]],
  },
  {
    id: "sco",
    name: "Scorpius",
    stars: [[24, 34], [34, 38], [44, 42], [50, 52], [56, 62], [60, 72], [70, 80], [78, 74], [74, 66]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  {
    id: "sgr",
    name: "Sagittarius",
    stars: [[30, 56], [40, 48], [42, 66], [54, 64], [56, 50], [66, 54], [64, 68], [50, 40]],
    lines: [[1, 4], [4, 5], [5, 6], [6, 3], [3, 2], [2, 0], [0, 1], [4, 7]],
  },
  {
    id: "cap",
    name: "Capricornus",
    stars: [[24, 44], [50, 36], [76, 46], [62, 66], [40, 66]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  {
    id: "aqr",
    name: "Aquarius",
    stars: [[32, 34], [48, 40], [62, 34], [54, 50], [66, 64], [46, 68]],
    lines: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5]],
  },
  {
    id: "psc",
    name: "Pisces",
    stars: [[18, 30], [34, 36], [48, 42], [58, 54], [54, 68], [68, 76]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },

  // ---- Other well-known constellations ----
  {
    id: "ori",
    name: "Orion",
    stars: [[34, 30], [62, 32], [44, 52], [50, 54], [56, 52], [32, 78], [66, 76]],
    lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  {
    id: "uma",
    name: "Ursa Major",
    stars: [[20, 40], [34, 36], [36, 52], [20, 54], [48, 50], [64, 52], [78, 46]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]],
  },
  {
    id: "umi",
    name: "Ursa Minor",
    stars: [[80, 22], [72, 34], [62, 44], [52, 52], [46, 66], [58, 68], [60, 54]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    id: "cas",
    name: "Cassiopeia",
    stars: [[18, 42], [36, 56], [52, 42], [68, 58], [84, 42]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: "cyg",
    name: "Cygnus",
    stars: [[50, 16], [50, 46], [50, 80], [26, 42], [74, 50]],
    lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  {
    id: "lyr",
    name: "Lyra",
    stars: [[38, 26], [52, 32], [42, 48], [58, 52], [48, 64]],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]],
  },
  {
    id: "aql",
    name: "Aquila",
    stars: [[50, 28], [40, 42], [60, 44], [50, 56], [38, 70], [62, 70]],
    lines: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]],
  },
  {
    id: "peg",
    name: "Pegasus",
    stars: [[30, 30], [72, 30], [72, 72], [30, 72], [16, 20]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4]],
  },
  {
    id: "per",
    name: "Perseus",
    stars: [[36, 24], [46, 42], [54, 58], [48, 74], [66, 52], [74, 40]],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]],
  },
  {
    id: "dra",
    name: "Draco",
    stars: [[22, 76], [30, 62], [42, 56], [52, 60], [58, 48], [52, 38], [40, 34], [50, 24], [62, 28]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  {
    id: "cma",
    name: "Canis Major",
    stars: [[38, 36], [52, 30], [56, 48], [46, 58], [64, 62], [58, 76]],
    lines: [[0, 1], [0, 2], [2, 3], [2, 4], [4, 5]],
  },
  {
    id: "cru",
    name: "Crux",
    stars: [[50, 22], [50, 72], [26, 46], [74, 44]],
    lines: [[0, 1], [2, 3]],
  },
  {
    id: "boo",
    name: "Boötes",
    stars: [[46, 76], [34, 58], [46, 40], [62, 44], [66, 62], [54, 58]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5]],
  },
  {
    id: "crb",
    name: "Corona Borealis",
    stars: [[26, 56], [34, 44], [46, 40], [58, 42], [70, 52], [78, 64]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    id: "del",
    name: "Delphinus",
    stars: [[46, 40], [58, 44], [54, 56], [42, 52], [40, 66]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4]],
  },
];

const BY_ID = new Map(CONSTELLATION_DATA.map((c) => [c.id, c]));
export function constellationById(id: string): Constellation | undefined {
  return BY_ID.get(id);
}

