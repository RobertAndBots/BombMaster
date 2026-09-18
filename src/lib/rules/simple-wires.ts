/**
 * Simple Wires — manual p5.
 *
 * Ported from the original `src/components/simpleWires/gen.js`, which is the
 * most interesting code in the old site and is preserved almost verbatim. The
 * generator does not pick a random bomb and then solve it; it picks which
 * *condition* should fire and then searches for a wire configuration that
 * satisfies that condition while violating every condition above it. That is
 * what makes the drill teach the table rather than the common cases — without
 * it, "cut the last wire" outcomes would almost never come up.
 *
 * Everything here is pure. `solve()` is the same function the study page and
 * any future drill mode use to decide what the right answer is, so the prose
 * and the practice can never disagree about a rule.
 */
import { rnd, randomItem, shuffle, type Rng } from '../rng'

export const WIRE_COLORS = ['B', 'U', 'R', 'W', 'Y'] as const
export type WireColor = (typeof WIRE_COLORS)[number]

export const COLOR_NAMES: Record<WireColor, string> = {
  B: 'Black',
  U: 'Blue',
  R: 'Red',
  W: 'White',
  Y: 'Yellow',
}

/** A wire-count condition: how many wires of a colour the rule requires. */
type ColorCondition = 'zero' | 'one' | 'two' | 'last'

const ZERO: ColorCondition = 'zero'
const ONE: ColorCondition = 'one'
const TWO: ColorCondition = 'two'
const LAST: ColorCondition = 'last'

/**
 * A row of the manual's table. Colour keys carry the wire-count requirement,
 * `odd` means "serial number is odd", and `cut` is either a 1-indexed wire
 * position or a colour meaning "the last wire of that colour".
 *
 * Order is load-bearing: conditions are checked top to bottom and the first
 * match wins, exactly as the manual reads.
 */
export type Condition = Partial<Record<WireColor, ColorCondition>> & {
  odd?: boolean
  cut: number | WireColor
}

export const CONDITIONS: Record<number, Condition[]> = {
  3: [{ R: ZERO, cut: 2 }, { W: LAST, cut: 3 }, { U: TWO, cut: 'U' }, { cut: 3 }],
  4: [
    { R: TWO, odd: true, cut: 'R' },
    { Y: LAST, R: ZERO, cut: 1 },
    { U: ONE, cut: 1 },
    { Y: TWO, cut: 4 },
    { cut: 2 },
  ],
  5: [
    { B: LAST, odd: true, cut: 4 },
    { R: ONE, Y: TWO, cut: 1 },
    { B: ZERO, cut: 2 },
    { cut: 1 },
  ],
  6: [
    { Y: ZERO, odd: true, cut: 3 },
    { Y: ONE, W: TWO, cut: 4 },
    { R: ZERO, cut: 6 },
    { cut: 4 },
  ],
}

/** A generated module: the wires on the bomb, and whether the serial is odd. */
export type WireConfig = {
  wires: WireColor[]
  odd: boolean
}

// ---- solving ---------------------------------------------------------------

/** Index into `CONDITIONS[n]` of the first rule that matches this bomb. */
export function conditionIndex({ wires, odd }: WireConfig): number {
  const conds = CONDITIONS[wires.length]
  if (!conds) throw new Error(`No conditions for ${wires.length} wires`)

  const count = {} as Record<WireColor, number>
  for (const c of WIRE_COLORS) count[c] = 0
  for (const c of wires) count[c] += 1

  for (let i = 0; i < conds.length; i++) {
    const cond = conds[i]!
    const failed = (Object.keys(cond) as (keyof Condition)[]).some((key) => {
      if (key === 'cut') return false
      if (key === 'odd') return cond.odd !== odd

      const c = key as WireColor
      const cc = cond[c]!
      const num = count[c]
      const isLast = wires[wires.length - 1] === c

      if (cc === ZERO) return num !== 0
      if (cc === ONE) return num !== 1
      if (cc === TWO) return num < 2
      if (cc === LAST) return !isLast
      return false
    })
    if (!failed) return i
  }

  throw new Error('One of the conditions should always match')
}

/** Which wire to cut: a 1-indexed position, or the last wire of a colour. */
export function solve(config: WireConfig): number | WireColor {
  return CONDITIONS[config.wires.length]![conditionIndex(config)]!.cut
}

/** Resolve `solve()` to a concrete 1-indexed wire position. */
export function solvePosition(config: WireConfig): number {
  const cut = solve(config)
  if (typeof cut === 'number') return cut
  const idx = config.wires.lastIndexOf(cut)
  if (idx < 0) throw new Error(`No ${cut} wire to cut`)
  return idx + 1
}

// ---- generating ------------------------------------------------------------

/**
 * Constraints accumulated while building a configuration. Per colour: a min
 * and max count, and whether it must (or must not) be the last wire.
 */
type ColorConstraint = { min?: number; max?: number; last?: boolean }
type Constraints = Partial<Record<WireColor, ColorConstraint>> & { odd?: boolean }

/** A single atomic constraint, before it is merged into the accumulator. */
type Atom = ({ color: WireColor } & ColorConstraint) | { odd: boolean }

/**
 * Turn one table row into atomic constraints.
 *
 * `negate` flips it into "make this rule NOT match", which is how the
 * generator guarantees an earlier condition does not steal the match. Note the
 * asymmetry: negating "exactly one red" means *either* 2+ reds or 0 reds, so it
 * returns two alternatives the caller must try in turn.
 */
function convertCondition(cond: Condition, numWires: number, negate: boolean): Atom[] {
  const out: Atom[] = []

  if (cond.odd) out.push({ odd: !negate })

  for (const c of WIRE_COLORS) {
    const d = cond[c]
    if (!d) continue

    const col: { color: WireColor } & ColorConstraint = { color: c }
    let secondary: Atom | undefined

    if (!negate) {
      if (d === ZERO) col.max = 0
      else if (d === ONE) {
        col.min = 1
        col.max = 1
      } else if (d === TWO) col.min = 2
      else if (d === LAST) {
        col.last = true
        col.min = 1
      }
    } else {
      if (d === ZERO) col.min = 1
      else if (d === ONE) {
        col.min = 2
        secondary = { color: c, max: 0 }
      } else if (d === TWO) col.max = 1
      else if (d === LAST) {
        col.last = false
        col.max = numWires - 1
      }
    }

    out.push(col)
    if (secondary) out.push(secondary)
  }

  return out
}

/** Merge one atom into the accumulator, or return null if it contradicts. */
function merge(base: Constraints, atom: Atom): Constraints | null {
  const next: Constraints = structuredClone(base)

  if ('odd' in atom) {
    if ('odd' in next) throw new Error('odd should not already be constrained')
    next.odd = atom.odd
    return next
  }

  const c = atom.color
  const existing = next[c]
  if (!existing) {
    const { color: _color, ...rest } = atom
    next[c] = rest
    return next
  }

  const baseMin = existing.min ?? -1
  const baseMax = existing.max ?? 7

  if ('last' in atom && atom.last !== undefined) {
    if ('last' in existing) throw new Error('last should not already be constrained')
    existing.last = atom.last
  }
  if (atom.min !== undefined) {
    if (atom.min > baseMax) return null
    if (atom.min >= baseMin) existing.min = atom.min
  }
  if (atom.max !== undefined) {
    if (atom.max < baseMin) return null
    if (atom.max <= baseMax) existing.max = atom.max
  }

  return next
}

function minWiresFor(constraints: Constraints): number {
  let total = 0
  for (const c of WIRE_COLORS) total += constraints[c]?.min ?? 0
  return total
}

/**
 * Apply each negated condition, backtracking when a choice paints us into a
 * corner. Each entry of `conds` is a set of ALTERNATIVES (see convertCondition)
 * and only one of them has to hold for that rule to be defeated.
 */
function negateMerge(base: Constraints, conds: Atom[][], numWires: number): Constraints | null {
  if (conds.length === 0) return base

  for (const atom of shuffleAtoms(conds[0]!)) {
    const merged = merge(base, atom)
    if (!merged) continue
    if (minWiresFor(merged) > numWires) continue

    const check = negateMerge(merged, conds.slice(1), numWires)
    if (check) return check
  }

  return null
}

// Deliberately unseeded: this only reorders the search, never the outcome, so
// it cannot affect reproducibility of a seeded generate().
function shuffleAtoms(atoms: Atom[]): Atom[] {
  return atoms.slice().sort(() => Math.random() - 0.5)
}

function constraintsFor(numWires: number, conds: Condition[], trueIdx: number): Constraints {
  let base: Constraints = {}
  for (const atom of convertCondition(conds[trueIdx]!, numWires, false)) {
    const merged = merge(base, atom)
    if (!merged) throw new Error('A condition should never contradict itself')
    base = merged
  }

  const negated = conds.slice(0, trueIdx).map((cond) => convertCondition(cond, numWires, true))
  const result = negateMerge(base, negated, numWires)
  if (!result) {
    throw new Error(`No configuration satisfies condition ${trueIdx} with ${numWires} wires`)
  }
  return result
}

function pickCounts(
  rng: Rng,
  constraints: Constraints,
  numWires: number,
): Record<WireColor, number> {
  const count = {} as Record<WireColor, number>
  const remaining = {} as Partial<Record<WireColor, number>>
  let total = 0

  for (const c of WIRE_COLORS) {
    const cc = constraints[c] ?? {}
    const min = cc.min ?? 0
    const max = cc.max ?? numWires
    count[c] = min
    total += min
    const room = max - min
    if (room > 0) remaining[c] = room
  }

  while (total < numWires) {
    const options = Object.keys(remaining) as WireColor[]
    if (options.length === 0) throw new Error('Ran out of colours before filling the module')
    const c = randomItem(rng, options)
    count[c]++
    total++
    remaining[c]!--
    if (remaining[c] === 0) delete remaining[c]
  }

  return count
}

function buildConfig(rng: Rng, constraints: Constraints, numWires: number): WireConfig {
  const counts = pickCounts(rng, constraints, numWires)

  let wires: WireColor[] = []
  for (const c of WIRE_COLORS) wires = wires.concat(Array<WireColor>(counts[c]).fill(c))
  wires = shuffle(rng, wires)

  // Honour the `last` constraints by swapping rather than re-rolling, so a
  // configuration is never rejected this late.
  let lastYes: WireColor | undefined
  const lastNo: WireColor[] = []
  for (const c of WIRE_COLORS) {
    const cc = constraints[c]
    if (!cc || cc.last === undefined) continue
    if (cc.last) {
      if (lastYes) throw new Error('At most one colour can be required last')
      lastYes = c
    } else {
      lastNo.push(c)
    }
  }

  if (lastYes && wires[wires.length - 1] !== lastYes) {
    const idx = wires.indexOf(lastYes)
    if (idx < 0) throw new Error(`${lastYes} must be present to be the last wire`)
    wires[idx] = wires[wires.length - 1]!
    wires[wires.length - 1] = lastYes
  }

  if (lastNo.includes(wires[wires.length - 1]!)) {
    for (let i = 0; i < wires.length; i++) {
      if (!lastNo.includes(wires[i]!)) {
        const tmp = wires[i]!
        wires[i] = wires[wires.length - 1]!
        wires[wires.length - 1] = tmp
        break
      }
    }
    if (lastNo.includes(wires[wires.length - 1]!)) {
      throw new Error('Cannot satisfy the last-wire constraint')
    }
  }

  const odd = constraints.odd ?? rng() < 0.5

  return { odd, wires }
}

/**
 * Generate a module. With no `numWires` it picks 3-6; the condition that fires
 * is chosen uniformly, so every row of the table comes up equally often.
 */
export function generate(rng: Rng, numWires?: number): WireConfig {
  const n = numWires ?? rnd(rng, 3, 7)
  const conds = CONDITIONS[n]
  if (!conds) throw new Error(`Unsupported wire count: ${n}`)

  const trueIdx = rnd(rng, conds.length)
  return buildConfig(rng, constraintsFor(n, conds, trueIdx), n)
}

/** Generate a module whose answer is decided by a specific table row. */
export function generateForCondition(rng: Rng, numWires: number, trueIdx: number): WireConfig {
  const conds = CONDITIONS[numWires]
  if (!conds) throw new Error(`Unsupported wire count: ${numWires}`)
  if (trueIdx < 0 || trueIdx >= conds.length) {
    throw new Error(`No condition ${trueIdx} for ${numWires} wires`)
  }
  return buildConfig(rng, constraintsFor(numWires, conds, trueIdx), numWires)
}
