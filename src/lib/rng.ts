/**
 * A random source the drills take as a parameter.
 *
 * The old site called `Math.random()` directly from inside components, which
 * meant a generator could not be tested: there was no way to ask "given this
 * seed, does it produce a configuration the rules actually accept?" Threading
 * an `Rng` through instead makes every generator reproducible, so a test can
 * run thousands of seeded configurations and assert the solver agrees with the
 * generator on all of them.
 *
 * Production passes `mathRandom`. Tests pass `seeded(n)`.
 */
export type Rng = () => number

export const mathRandom: Rng = Math.random

/**
 * mulberry32 — small, fast, and good enough for shuffling wires. It is NOT
 * cryptographic and nothing here needs it to be.
 */
export function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in [min, max), or [0, min) when `max` is omitted. */
export function rnd(rng: Rng, min: number, max?: number): number {
  if (max == null) {
    max = min
    min = 0
  }
  return Math.floor(rng() * (max - min)) + min
}

export function randomItem<T>(rng: Rng, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('randomItem: empty array')
  return arr[rnd(rng, arr.length)]!
}

/** Fisher-Yates. Returns a new array; the input is not modified. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(rng, i + 1)
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
