// Animated neural-network SVG background — theme-aware.
export default function NeuralBackground({ className = "" }: { className?: string }) {
  const nodes = Array.from({ length: 28 }, (_, i) => {
    const s1 = Math.sin(i * 12.9898) * 43758.5453;
    const s2 = Math.cos(i * 78.233) * 12345.678;
    return {
      x: Math.abs(s1 - Math.floor(s1)) * 100,
      y: Math.abs(s2 - Math.floor(s2)) * 100,
    };
  });
  const links: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < 22) links.push([i, j]);
    }
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full ${className}`} aria-hidden>
      <defs>
        <radialGradient id="nb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#nb-glow)" opacity="0.5" />
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="hsl(var(--primary))" strokeOpacity="0.35" strokeWidth="0.12">
          <animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
        </line>
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="0.5" fill="hsl(var(--secondary))" />
          <circle cx={n.x} cy={n.y} r="1.5" fill="hsl(var(--primary))" opacity="0.2">
            <animate attributeName="r" values="1;3;1" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0;0.25" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}
