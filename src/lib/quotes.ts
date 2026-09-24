/**
 * Daily affirmations shown under the home heading. One is picked per calendar
 * day and cycles through the whole list on rotation.
 */
export const QUOTES = [
  "I am a vibrational match to all that I desire.",
  "I am in alignment with abundance in every area of my life.",
  "Everything I need is already flowing toward me.",
  "I trust the timing of my life.",
  "My thoughts create my reality, and I choose thoughts of abundance.",
  "I am worthy of everything I want.",
  "I attract opportunities that are aligned with my highest good.",
  "I release resistance and allow good things to come easily.",
  "I am the architect of my own life.",
  "My energy is a magnet for miracles.",
  "I am open and receptive to all forms of abundance.",
  "Every day, I move closer to my goals.",
  "I trust myself to make the right decisions.",
  "I am becoming the person I'm meant to be.",
  "My potential is limitless.",
  "I choose growth over comfort.",
  "I am grateful for what I have and excited for what's coming.",
  "I radiate confidence and positivity.",
  "I am aligned with my purpose.",
  "Success flows to me effortlessly.",
  "I am exactly where I need to be right now.",
  "My dreams are valid and achievable.",
  "I let go of what no longer serves me.",
  "I am creating a life I love, one choice at a time.",
  "I trust the process, even when I can't see the full picture.",
  "I am deserving of rest, joy, and ease.",
  "My focus determines my reality.",
  "I am in control of my own happiness.",
  "I attract people and experiences that elevate me.",
  "I am constantly evolving into a better version of myself.",
  "Abundance is my natural state.",
  "I welcome change as a path to growth.",
  "My intentions are powerful and my actions follow through.",
  "I am aligned with love, health, and prosperity.",
  "Every small step I take is progress.",
  "I am patient with myself as I grow.",
  "I choose peace over worry.",
  "I trust that everything is working out in my favor.",
  "My habits shape my destiny.",
  "I am proud of how far I've come.",
  "I give myself permission to dream big.",
  "I am resilient, capable, and strong.",
  "My mindset shapes my momentum.",
  "I attract clarity and make empowered choices.",
  "I am building the life I've always imagined.",
  "I release fear and embrace possibility.",
  "Good things are already on their way to me.",
  "I am consistent, and consistency compounds.",
  "I honor my journey and trust my pace.",
  "I am becoming who I was always meant to be.",
] as const;

/**
 * The affirmation for a given local day (defaults to today). Uses the number of
 * days since the epoch so every day advances one step through the list, wrapping
 * around at the end.
 */
export function quoteOfTheDay(today?: string): string {
  const iso = today ?? new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local
  const dayIndex = Math.floor(new Date(`${iso}T00:00:00`).getTime() / 86_400_000);
  const i = ((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[i] ?? QUOTES[0];
}
