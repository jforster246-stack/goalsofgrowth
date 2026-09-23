import { useEffect, useMemo, useState } from "react";

const COLORS = ["#49552d", "#88936b", "#b97d69", "#863d2b", "#bb996b", "#895c2d"];

/**
 * A short, dependency-free confetti burst from the centre of the screen.
 * Mount it with a changing `key` to replay; it removes itself when done.
 */
export function Confetti() {
  const [gone, setGone] = useState(false);

  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 180;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 120 - Math.random() * 80,
          rotate: (Math.random() * 2 - 1) * 540,
          delay: Math.random() * 80,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          w: 6 + Math.random() * 6,
          h: 10 + Math.random() * 8,
        };
      }),
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1300);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-[42%]">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute block rounded-[2px]"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              backgroundColor: p.color,
              animation: `confetti-burst 1.15s cubic-bezier(0.2, 0.6, 0.3, 1) ${p.delay}ms forwards`,
              // custom props consumed by the keyframes
              ["--x" as string]: `${p.x}px`,
              ["--y" as string]: `${p.y}px`,
              ["--r" as string]: `${p.rotate}deg`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
