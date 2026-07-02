import { useEffect, useState } from "react";

export default function RotatingWords({
  words,
  interval = 2200,
  className = "",
}: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
  return (
    <span className={`relative inline-block align-baseline ${className}`}>
      <span className="invisible whitespace-nowrap">{longest}</span>
      {words.map((w, idx) => (
        <span
          key={w}
          className={`absolute inset-0 whitespace-nowrap transition-all duration-700 ease-out ${
            idx === i
              ? "opacity-100 translate-y-0 blur-0"
              : "opacity-0 -translate-y-3 blur-sm"
          }`}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
