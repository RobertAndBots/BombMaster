/**
 * Complicated Wires — manual p13.
 *
 * The manual presents this as a four-set Venn diagram, which is unreadable
 * under time pressure. The chart below is the same information as a 4x4 table:
 * wire colouring down the side, the LED/★ combination across the top.
 *
 * The transcription is cross-checked against the manual in the tests by
 * counting how many regions carry each instruction — the Venn diagram has 16
 * regions and a known count per letter, so a mis-transcribed cell shows up as
 * a count that no longer matches.
 */
export const INSTRUCTIONS = {
  C: { label: 'Cut', blurb: 'Cut the wire' },
  D: { label: "Don't cut", blurb: 'Do not cut the wire' },
  S: { label: 'Serial even', blurb: 'Cut if the last digit of the serial number is even' },
  P: { label: 'Parallel port', blurb: 'Cut if the bomb has a parallel port' },
  B: { label: 'Batteries', blurb: 'Cut if the bomb has 2 or more batteries' },
} as const

export type Instruction = keyof typeof INSTRUCTIONS

export const WIRE_KINDS = ['White', 'Red', 'Blue', 'RedBlue'] as const
export type WireKind = (typeof WIRE_KINDS)[number]

export const WIRE_KIND_LABELS: Record<WireKind, string> = {
  White: 'White',
  Red: 'Red',
  Blue: 'Blue',
  RedBlue: 'Red & Blue',
}

/** The four LED/★ combinations, in chart column order. */
export const COMBOS = [
  { led: false, star: false },
  { led: false, star: true },
  { led: true, star: false },
  { led: true, star: true },
] as const

/**
 * `CHART[kind]` — one instruction per column of COMBOS.
 *
 * Read as four-letter words, which is how they are memorized:
 * White CCDB, Red SCBB, Blue SDPP, Red&Blue SPSD.
 */
export const CHART: Record<WireKind, Instruction[]> = {
  White: ['C', 'C', 'D', 'B'],
  Red: ['S', 'C', 'B', 'B'],
  Blue: ['S', 'D', 'P', 'P'],
  RedBlue: ['S', 'P', 'S', 'D'],
}

export type Wire = {
  kind: WireKind
  led: boolean
  star: boolean
}

export type BombState = {
  /** Last digit of the serial number is even. */
  serialEven: boolean
  parallelPort: boolean
  batteries: number
}

export function instructionFor(wire: Wire): Instruction {
  const col = COMBOS.findIndex((c) => c.led === wire.led && c.star === wire.star)
  const instruction = CHART[wire.kind][col]
  if (!instruction) throw new Error(`No chart entry for ${wire.kind}`)
  return instruction
}

/** Should this wire be cut, given the rest of the bomb? */
export function shouldCut(wire: Wire, bomb: BombState): boolean {
  switch (instructionFor(wire)) {
    case 'C':
      return true
    case 'D':
      return false
    case 'S':
      return bomb.serialEven
    case 'P':
      return bomb.parallelPort
    case 'B':
      return bomb.batteries >= 2
  }
}

/**
 * The study page's inversion of the chart: for each instruction, which
 * wire/LED/★ combinations produce it.
 *
 * Derived rather than restated — the old site listed these by hand alongside
 * the chart, which is two places to keep in step.
 */
export function combinationsFor(instruction: Instruction): string[] {
  const out: string[] = []
  for (const kind of WIRE_KINDS) {
    COMBOS.forEach((combo, idx) => {
      if (CHART[kind][idx] !== instruction) return
      const parts: string[] = []
      if (combo.led) parts.push('LED')
      parts.push(WIRE_KIND_LABELS[kind])
      if (combo.star) parts.push('Star')
      out.push(parts.join(' '))
    })
  }
  return out
}
