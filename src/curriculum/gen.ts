import { ALL_SQUARES, fenFrom, FILES } from "@/lib/chess";

/** Deterministic random numbers (mulberry32), so an exercise can be regenerated from its seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n: number) => Math.floor(next() * n),
    pick: <T,>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
    shuffle: <T,>(xs: readonly T[]): T[] => {
      const out = [...xs];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
export type Rng = ReturnType<typeof rng>;

export function randomSquare(r: Rng, avoid: string[] = [], ranks = [1, 2, 3, 4, 5, 6, 7, 8]): string {
  for (;;) {
    const sq = `${r.pick(FILES)}${r.pick(ranks)}`;
    if (!avoid.includes(sq)) return sq;
  }
}

/** Multiple choice with the correct answer shuffled in. */
export function choice(r: Rng, correct: string, wrong: string[]) {
  const options = r.shuffle([correct, ...wrong.filter((w) => w !== correct)]);
  return { options, answer: options.indexOf(correct) };
}

/** Try a generator until it accepts; keeps generated exercises honest. */
export function until<T>(r: Rng, make: (r: Rng) => T | null, tries = 400): T {
  for (let i = 0; i < tries; i++) {
    const v = make(r);
    if (v) return v;
  }
  throw new Error("generator failed to find a valid exercise");
}

export { ALL_SQUARES, fenFrom };

/** Fixed item: the same exercise every time. */
export function fixed(id: string, ex: import("./types").Exercise) {
  return { id, generate: () => ex };
}

/** Cycle through a list of authored exercises. */
export function bank(id: string, list: import("./types").Exercise[]) {
  return { id, generate: (seed: number) => list[Math.abs(seed) % list.length] };
}
