import { getHeroCardCounters } from "../lib/tabletop-assistant-rules.mjs";
import type { Hero } from "../lib/hero-types";

type CounterState = {
  entries: Record<string, number>;
};

export function HeroCardMarks({
  hero,
  state,
}: {
  hero: Hero;
  state?: CounterState | null;
}) {
  const counters = getHeroCardCounters(hero, state) as { name: string; count: number }[];

  if (!counters.length) return null;

  return (
    <div aria-label="本局标记" className="card-marks">
      {counters.map((counter) => (
        <span aria-label={`${counter.name}标记${counter.count}枚`} key={counter.name}>
          <b>{counter.name}</b>
          <i>×{counter.count}</i>
        </span>
      ))}
    </div>
  );
}
