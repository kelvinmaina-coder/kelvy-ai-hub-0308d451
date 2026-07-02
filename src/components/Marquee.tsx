export default function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const loop = [...items, ...items];
  return (
    <div className={`relative overflow-hidden group ${className}`}>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex gap-8 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {loop.map((t, i) => (
          <span key={i} className="text-xs font-mono text-muted-foreground tracking-widest flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
