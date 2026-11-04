/**
 * The Observatory's seeded curriculum — the things you learn about by spending
 * time on your hobbies. Each course is a sequence of lessons; each lesson holds
 * a handful of short facts that reveal one at a time. Content is static here
 * (no database), so it syncs with the app and needs no migration. Progress and
 * the "reveals" currency live in curriculum.ts (localStorage).
 */

export type CourseIcon = "palette" | "star";

export type Lesson = {
  /** Stable key used for storage. */
  id: string;
  title: string;
  /** The maker / context line under the title. */
  subtitle: string;
  /** A short era or place note. */
  meta: string;
  /** Soft two-colour gradient for the lesson's plate (shows behind the image). */
  tint: readonly [string, string];
  /** Public-domain image served from /public, if the lesson has one. */
  image?: string;
  facts: readonly string[];
};

export type Course = {
  id: string;
  name: string;
  blurb: string;
  icon: CourseIcon;
  lessons: readonly Lesson[];
};

export const COURSES: readonly Course[] = [
  {
    id: "art",
    name: "Art",
    blurb: "A famous work at a time",
    icon: "palette",
    lessons: [
      {
        id: "great-wave",
        title: "The Great Wave off Kanagawa",
        subtitle: "Katsushika Hokusai",
        meta: "Japan · c. 1831",
        tint: ["#e3edf1", "#c6d8df"],
        image: "/observatory/great-wave.jpg",
        facts: [
          "It's a woodblock print, not a painting - carved into blocks and pressed onto paper, one colour at a time.",
          "Mount Fuji is the real subject: it sits small and calm in the distance, dwarfed by the wave in front of it.",
          "That deep blue is Prussian blue, a pigment newly arrived in Japan when Hokusai made it.",
          "It opens his series 'Thirty-six Views of Mount Fuji', made when he was already in his seventies.",
          "Thousands of prints were pulled from the blocks, which is how a single design reached the whole world.",
          "Its ripple reached Europe too, echoing through Monet, van Gogh and Debussy's music.",
        ],
      },
      {
        id: "starry-night",
        title: "The Starry Night",
        subtitle: "Vincent van Gogh",
        meta: "France · 1889",
        tint: ["#e5e7f3", "#c7cbe6"],
        image: "/observatory/starry-night.jpg",
        facts: [
          "Van Gogh painted it from memory, in daylight, while staying at an asylum in Saint-Remy.",
          "The view is loosely from his bedroom window, though he invented the little village himself.",
          "The bright 'star' beside the cypress tree is thought to be the planet Venus.",
          "The thick, swirling ridges of paint are called impasto - laid on so heavily you can see every stroke.",
          "He sold almost nothing in his lifetime, yet this is now one of the most recognised paintings on Earth.",
          "It lives at the Museum of Modern Art in New York.",
        ],
      },
      {
        id: "pearl-earring",
        title: "Girl with a Pearl Earring",
        subtitle: "Johannes Vermeer",
        meta: "Dutch Republic · c. 1665",
        tint: ["#efeae1", "#d8cdbb"],
        image: "/observatory/pearl-earring.jpg",
        facts: [
          "It isn't a portrait of a named person - it's a 'tronie', a Dutch study of a face and costume.",
          "Vermeer was a master of light: see how it catches her damp lower lip and the earring.",
          "That pearl may not be a pearl at all - it's so large it was likely polished glass or tin.",
          "The painting nearly vanished, selling for next to nothing in 1881 before anyone knew its worth.",
          "It's sometimes called 'the Mona Lisa of the North'.",
          "It hangs in the Mauritshuis in The Hague.",
        ],
      },
      {
        id: "birth-of-venus",
        title: "The Birth of Venus",
        subtitle: "Sandro Botticelli",
        meta: "Florence · c. 1485",
        tint: ["#eaf0e9", "#cfe0d2"],
        image: "/observatory/birth-of-venus.jpg",
        facts: [
          "It shows the goddess Venus arriving on shore, born fully grown from the sea foam.",
          "It was one of the first large works in Italy painted on canvas rather than a wooden panel.",
          "Botticelli made it in Florence, most likely for the powerful Medici family.",
          "Its soft, matte glow comes from tempera - pigment mixed with egg instead of oil.",
          "The model is often linked to Simonetta Vespucci, a celebrated beauty of the day.",
          "It lives in the Uffizi Gallery in Florence.",
        ],
      },
      {
        id: "the-kiss",
        title: "The Kiss",
        subtitle: "Gustav Klimt",
        meta: "Vienna · 1907-1908",
        tint: ["#f3ecd9", "#e7d6a8"],
        image: "/observatory/the-kiss.jpg",
        facts: [
          "Klimt covered it in real gold leaf, the signature of his 'Golden Phase'.",
          "Up close the couple dissolve into pattern: rectangles for him, flowers and circles for her.",
          "It was painted during a glittering, experimental moment in Austrian art.",
          "The pair kneel at the very edge of a flowering cliff, giving the tender scene a quiet tension.",
          "Austria loved it at once and bought it before it was even finished.",
          "It's kept at the Belvedere museum in Vienna.",
        ],
      },
      {
        id: "grande-jatte",
        title: "A Sunday on La Grande Jatte",
        subtitle: "Georges Seurat",
        meta: "Paris · 1884-1886",
        tint: ["#e9ede2", "#d2dcc0"],
        image: "/observatory/grande-jatte.jpg",
        facts: [
          "Up close it's made of tiny separate dots of colour - a technique Seurat pioneered called pointillism.",
          "Your eye does the mixing, not the brush: dots of blue and yellow read as green from across the room.",
          "It's huge - about two metres tall and three wide - and took him roughly two years.",
          "It shows Parisians relaxing on an island in the river Seine on a Sunday afternoon.",
          "Seurat even painted dots onto the frame to complete the effect.",
          "It's a centrepiece of the Art Institute of Chicago.",
        ],
      },
    ],
  },
  {
    id: "night-sky",
    name: "The Night Sky",
    blurb: "What's really up there",
    icon: "star",
    lessons: [
      {
        id: "the-moon",
        title: "The Moon",
        subtitle: "Our nearest neighbour",
        meta: "384,000 km away",
        tint: ["#e8eaf0", "#ccd0e2"],
        facts: [
          "The Moon is drifting away from us by about 3.8 cm a year - roughly the rate your fingernails grow.",
          "It always shows us the same face, because it spins once for every orbit it makes around Earth.",
          "With no wind or rain, the astronauts' footprints from 1969 are still there today.",
          "The Moon raises our ocean tides, gently pulling the seas as it passes overhead.",
          "It's about a quarter the width of Earth - big enough that we're almost a double planet.",
        ],
      },
      {
        id: "saturn",
        title: "Saturn's Rings",
        subtitle: "The jewel of the solar system",
        meta: "The sixth planet",
        tint: ["#efeadb", "#ddcfa9"],
        facts: [
          "The rings are made almost entirely of ice, from specks of dust to chunks the size of houses.",
          "For all their width, they're astonishingly thin - often just tens of metres top to bottom.",
          "Saturn is so light for its size it would float, if you could find a big enough bath of water.",
          "Galileo saw the rings in 1610 but his telescope was too weak to make them out - he thought they were 'ears'.",
          "The rings may be young and fleeting, perhaps forming and fading within the solar system's lifetime.",
        ],
      },
      {
        id: "auroras",
        title: "The Northern Lights",
        subtitle: "Aurora borealis",
        meta: "High in the atmosphere",
        tint: ["#e2efe8", "#c2e0cf"],
        facts: [
          "They're made by particles from the Sun crashing into gases high in our atmosphere.",
          "The colours depend on which gas is glowing: oxygen gives green and red, nitrogen blue and purple.",
          "They ring the magnetic poles, so the far north sees them most often.",
          "The same lights glow around the South Pole, where they're called the aurora australis.",
          "They happen high up - usually 100 km or more above the ground, far above the clouds.",
        ],
      },
      {
        id: "comets",
        title: "Comets",
        subtitle: "Visitors from the deep",
        meta: "Icy wanderers",
        tint: ["#e6e8f2", "#c9cde6"],
        facts: [
          "A comet is essentially a 'dirty snowball' of ice and dust left over from the birth of the solar system.",
          "Its tail only appears near the Sun, as the ice warms and streams away.",
          "The tail always points away from the Sun, not backwards along its path - blown by the solar wind.",
          "Halley's Comet comes back about every 76 years; it'll next be visible in 2061.",
          "Some comets take thousands of years to loop around the Sun just once.",
        ],
      },
    ],
  },
];

export function courseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

/** Total number of facts across every lesson in a course. */
export function courseFactTotal(course: Course): number {
  return course.lessons.reduce((n, l) => n + l.facts.length, 0);
}

export type LessonProgress = {
  lessonIndex: number;
  revealedInLesson: number;
  lessonCount: number;
  /** Every fact in every lesson of the course is revealed. */
  allComplete: boolean;
};

/**
 * Turn a running count of facts revealed in a course into "which lesson are we
 * on, and how far into it." Lessons are worked through in order: once a lesson's
 * facts are all revealed, the next lesson becomes current.
 */
export function lessonProgress(course: Course, revealed: number): LessonProgress {
  let remaining = Math.max(0, revealed);
  for (let i = 0; i < course.lessons.length; i++) {
    const n = course.lessons[i]!.facts.length;
    if (remaining < n) {
      return { lessonIndex: i, revealedInLesson: remaining, lessonCount: n, allComplete: false };
    }
    remaining -= n;
  }
  const last = course.lessons.length - 1;
  const lastCount = course.lessons[last]!.facts.length;
  return {
    lessonIndex: last,
    revealedInLesson: lastCount,
    lessonCount: lastCount,
    allComplete: true,
  };
}

/** Lessons whose facts have all been revealed, in course order. */
export function completedLessons(course: Course, revealed: number): Lesson[] {
  let remaining = Math.max(0, revealed);
  const done: Lesson[] = [];
  for (const lesson of course.lessons) {
    if (remaining < lesson.facts.length) break;
    remaining -= lesson.facts.length;
    done.push(lesson);
  }
  return done;
}
