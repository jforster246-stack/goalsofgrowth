export type FrameDef = {
  id: number;
  src: string;
  /** Frame image aspect ratio (width / height). */
  ar: number;
  /** Transparent window inset as a fraction of each side. */
  inset: { l: number; r: number; t: number; b: number };
  /** border-radius for the mounted content, to match the window shape. */
  radius: string;
};

const src = (n: number) => `/frames/gold_frame_${String(n).padStart(2, "0")}.svg`;

/**
 * The ornate gold frames (measured windows + shapes). Content is mounted inside
 * the window and the frame image is laid over the top, so its opening mattes it.
 */
export const FRAMES: FrameDef[] = [
  { id: 1, src: src(1), ar: 0.733, inset: { l: 0.216, r: 0.216, t: 0.158, b: 0.161 }, radius: "3%" },
  { id: 2, src: src(2), ar: 0.675, inset: { l: 0.208, r: 0.19, t: 0.15, b: 0.134 }, radius: "3%" },
  { id: 3, src: src(3), ar: 0.755, inset: { l: 0.188, r: 0.167, t: 0.135, b: 0.123 }, radius: "3%" },
  { id: 4, src: src(4), ar: 0.684, inset: { l: 0.19, r: 0.199, t: 0.139, b: 0.142 }, radius: "3%" },
  { id: 5, src: src(5), ar: 0.816, inset: { l: 0.193, r: 0.185, t: 0.161, b: 0.164 }, radius: "3%" },
  { id: 6, src: src(6), ar: 0.735, inset: { l: 0.244, r: 0.239, t: 0.198, b: 0.191 }, radius: "3%" },
  { id: 7, src: src(7), ar: 0.982, inset: { l: 0.17, r: 0.19, t: 0.16, b: 0.19 }, radius: "50%" },
  { id: 8, src: src(8), ar: 1.245, inset: { l: 0.156, r: 0.154, t: 0.217, b: 0.215 }, radius: "4%" },
  { id: 9, src: src(9), ar: 1.391, inset: { l: 0.085, r: 0.083, t: 0.119, b: 0.124 }, radius: "2%" },
  { id: 10, src: src(10), ar: 0.922, inset: { l: 0.16, r: 0.158, t: 0.15, b: 0.154 }, radius: "24%" },
  { id: 11, src: src(11), ar: 1.004, inset: { l: 0.16, r: 0.166, t: 0.163, b: 0.167 }, radius: "16%" },
  { id: 12, src: src(12), ar: 1.19, inset: { l: 0.159, r: 0.158, t: 0.188, b: 0.185 }, radius: "4%" },
  { id: 13, src: src(13), ar: 1.382, inset: { l: 0.122, r: 0.13, t: 0.187, b: 0.127 }, radius: "2%" },
  { id: 14, src: src(14), ar: 1.382, inset: { l: 0.13, r: 0.1, t: 0.16, b: 0.16 }, radius: "50%" },
];

/** A stable frame choice for a given key, so a frame keeps its frame on re-render. */
export function frameFor(key: string): FrameDef {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return FRAMES[Math.abs(h) % FRAMES.length]!;
}
