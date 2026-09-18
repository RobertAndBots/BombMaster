/**
 * Simon Says — manual p8.
 *
 * A colour flashes; you press a different colour, chosen from a table that
 * depends on whether the serial number contains a vowel and how many strikes
 * you already have. Six tables in all, and the strike count changing mid-module
 * is what makes it nasty.
 *
 * ⚠️ The mapping below was re-derived from the manual PDF (p8) rather than
 * carried over from the old site, because the old site's "no vowel, 1 strike"
 * advice was wrong — see `src/content/modules/simon-says.mdx`.
 */
import { randomItem, rnd, type Rng } from '../rng'

export const COLORS = ['Red', 'Blue', 'Green', 'Yellow'] as const
export type Color = (typeof COLORS)[number]

export type Mapping = Record<Color, Color>

/**
 * `MAPPINGS[hasVowel][strikes]` — which colour to press for each flash.
 *
 * Transcribed from the manual's two tables. `strikes` is 0, 1 or 2; the game
 * caps the lookup at 2 because a third strike ends the bomb.
 */
export const MAPPINGS: Record<'vowel' | 'noVowel', Mapping[]> = {
  vowel: [
    { Red: 'Blue', Blue: 'Red', Green: 'Yellow', Yellow: 'Green' },
    { Red: 'Yellow', Blue: 'Green', Green: 'Blue', Yellow: 'Red' },
    { Red: 'Green', Blue: 'Red', Green: 'Yellow', Yellow: 'Blue' },
  ],
  noVowel: [
    { Red: 'Blue', Blue: 'Yellow', Green: 'Green', Yellow: 'Red' },
    { Red: 'Red', Blue: 'Blue', Green: 'Yellow', Yellow: 'Green' },
    { Red: 'Yellow', Blue: 'Green', Green: 'Blue', Yellow: 'Red' },
  ],
}

export const MAX_STRIKES = 2

export function mappingFor(hasVowel: boolean, strikes: number): Mapping {
  const table = MAPPINGS[hasVowel ? 'vowel' : 'noVowel']
  const mapping = table[Math.min(strikes, MAX_STRIKES)]
  if (!mapping) throw new Error(`No Simon Says mapping for ${strikes} strikes`)
  return mapping
}

/** Which button to press for a flash. */
export function solve(flash: Color, hasVowel: boolean, strikes: number): Color {
  return mappingFor(hasVowel, strikes)[flash]
}

/** Translate a whole flash sequence. */
export function solveSequence(flashes: Color[], hasVowel: boolean, strikes: number): Color[] {
  const mapping = mappingFor(hasVowel, strikes)
  return flashes.map((f) => mapping[f])
}

export type SimonRound = {
  flashes: Color[]
  hasVowel: boolean
  strikes: number
}

export function generate(rng: Rng, length?: number): SimonRound {
  const n = length ?? rnd(rng, 1, 6)
  return {
    flashes: Array.from({ length: n }, () => randomItem(rng, COLORS)),
    hasVowel: rng() < 0.5,
    strikes: rnd(rng, MAX_STRIKES + 1),
  }
}
