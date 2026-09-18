/**
 * The Button — manual p6.
 *
 * Ported from `src/components/button/practice.jsx`, where the whole ruleset
 * lived inside a component method. The generator follows the same shape as
 * Simple Wires: pick which condition should fire, then build a bomb that
 * satisfies it and defeats every condition above it.
 */
import { randomItem, rnd, type Rng } from '../rng'

export const BUTTON_COLORS = ['B', 'U', 'R', 'W', 'Y'] as const
export type ButtonColor = (typeof BUTTON_COLORS)[number]

export const BUTTON_COLOR_NAMES: Record<ButtonColor, string> = {
  B: 'Black',
  U: 'Blue',
  R: 'Red',
  W: 'White',
  Y: 'Yellow',
}

export const BUTTON_LABELS = ['Abort', 'Detonate', 'Hold', 'Press'] as const
export type ButtonLabel = (typeof BUTTON_LABELS)[number]

export const STRIP_COLORS = ['Blue', 'Red', 'White', 'Yellow'] as const
export type StripColor = (typeof STRIP_COLORS)[number]

/**
 * Which position on the countdown timer to release on.
 *
 * Blue is 4, yellow is 5, anything else is 1 — the mnemonic the study page
 * teaches. "Contains the digit", so a timer showing 43 also releases on 4.
 */
export const STRIP_RELEASE: Record<StripColor, number> = {
  Blue: 4,
  Yellow: 5,
  Red: 1,
  White: 1,
}

export type ButtonConfig = {
  color: ButtonColor
  label: ButtonLabel
  batteries: number
  /** Lit indicators on the bomb. FRQ is decoration — no rule looks at it. */
  indicators: string[]
}

export type ButtonAction = 'hold' | 'tap'

/**
 * The manual's table, in order. The first row that matches wins.
 *
 * Actions alternate hold / tap starting with hold, which is the shortcut the
 * study page leans on — so it is asserted in the tests rather than written out
 * per row.
 */
export const BUTTON_CONDITIONS: { rule: string; action: ButtonAction }[] = [
  { rule: 'Blue button labelled "Abort"', action: 'hold' },
  { rule: 'More than 1 battery and labelled "Detonate"', action: 'tap' },
  { rule: 'White button and a lit CAR indicator', action: 'hold' },
  { rule: 'More than 2 batteries and a lit FRK indicator', action: 'tap' },
  { rule: 'Yellow button', action: 'hold' },
  { rule: 'Red button labelled "Hold"', action: 'tap' },
  { rule: 'Anything else', action: 'hold' },
]

// ---- solving ---------------------------------------------------------------

export function conditionIndex(c: ButtonConfig): number {
  const lit = (name: string) => c.indicators.includes(name)

  if (c.color === 'U' && c.label === 'Abort') return 0
  if (c.batteries > 1 && c.label === 'Detonate') return 1
  if (c.color === 'W' && lit('CAR')) return 2
  if (c.batteries > 2 && lit('FRK')) return 3
  if (c.color === 'Y') return 4
  if (c.color === 'R' && c.label === 'Hold') return 5
  return 6
}

export function solve(c: ButtonConfig): ButtonAction {
  return BUTTON_CONDITIONS[conditionIndex(c)]!.action
}

/** Where on the timer to release a held button, given the lit strip. */
export function releaseDigit(strip: StripColor): number {
  return STRIP_RELEASE[strip]
}

// ---- generating ------------------------------------------------------------

/**
 * Build a bomb whose answer is decided by `target`.
 *
 * Reads as a walk down the table: at each row, either satisfy it and stop, or
 * defeat it and carry on. Defeating a row usually has two ways — drop the
 * colour/label, or drop the battery count / indicator — and it picks between
 * them so the drill does not always defeat rules the same way.
 */
export function generateForCondition(rng: Rng, target: number): ButtonConfig {
  if (target < 0 || target >= BUTTON_CONDITIONS.length) {
    throw new Error(`No button condition ${target}`)
  }

  let options: string[] = []
  for (const c of BUTTON_COLORS) {
    for (const l of 'ADHP') options.push(`${c}${l}`)
  }
  let indicatorSets = ['CF', 'C', 'F', '']
  let maxBatteries: number | null = null

  const coin = () => rng() < 0.5
  const keep = (f: (o: string) => boolean) => (options = options.filter(f))
  const keepInd = (f: (o: string) => boolean) => (indicatorSets = indicatorSets.filter(f))

  const build = (minBatteries = 0): ButtonConfig => {
    const config = randomItem(rng, options)
    const set = randomItem(rng, indicatorSets)
    const indicators: string[] = []
    if (set.includes('C')) indicators.push('CAR')
    if (set.includes('F')) indicators.push('FRK')
    // A lit indicator no rule cares about, so the drill teaches you to ignore it.
    if (rng() < 0.3) indicators.push('FRQ')

    const labels: Record<string, ButtonLabel> = {
      A: 'Abort',
      D: 'Detonate',
      H: 'Hold',
      P: 'Press',
    }

    return {
      color: config[0] as ButtonColor,
      label: labels[config[1]!]!,
      indicators,
      batteries: rnd(rng, minBatteries, maxBatteries ?? 4),
    }
  }

  // Row 0 — blue "Abort"
  if (target > 0) {
    keep((o) => o !== 'UA')
  } else {
    keep((o) => o === 'UA')
    return build()
  }

  // Row 1 — 2+ batteries and "Detonate"
  if (target > 1) {
    // Row 3 needs 3+ batteries, so it cannot be defeated by capping them.
    if (target !== 3 && coin()) maxBatteries = 1
    else keep((o) => o[1] !== 'D')
  } else {
    keep((o) => o[1] === 'D')
    return build(2)
  }

  // Row 2 — white button and lit CAR
  if (target > 2) {
    if (coin()) keep((o) => o[0] !== 'W')
    else keepInd((o) => !o.includes('C'))
  } else {
    keep((o) => o[0] === 'W')
    keepInd((o) => o.includes('C'))
    return build()
  }

  // Row 3 — 3+ batteries and lit FRK
  if (target > 3) {
    if (coin()) maxBatteries = maxBatteries != null ? Math.min(2, maxBatteries) : 2
    else keepInd((o) => !o.includes('F'))
  } else {
    keepInd((o) => o.includes('F'))
    return build(3)
  }

  // Row 4 — yellow button
  if (target > 4) {
    keep((o) => o[0] !== 'Y')
  } else {
    keep((o) => o[0] === 'Y')
    return build()
  }

  // Row 5 — red "Hold"
  if (target > 5) {
    keep((o) => o !== 'RH')
  } else {
    keep((o) => o === 'RH')
    return build()
  }

  // Row 6 — anything else
  return build()
}

export function generate(rng: Rng): ButtonConfig {
  return generateForCondition(rng, rnd(rng, BUTTON_CONDITIONS.length))
}
