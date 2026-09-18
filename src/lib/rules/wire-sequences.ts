/**
 * Wire Sequences — manual p14.
 *
 * Wires arrive across several panels, and what you do with one depends on how
 * many wires of that colour you have already seen across the whole module —
 * so the state you carry between panels is three running counts.
 *
 * Each table row says which letters the wire may be connected to for it to be
 * cut. Nine rows per colour, one per occurrence.
 */
export const SEQUENCE_COLORS = ['Red', 'Blue', 'Black'] as const
export type SequenceColor = (typeof SEQUENCE_COLORS)[number]

export const LETTERS = ['A', 'B', 'C'] as const
export type Letter = (typeof LETTERS)[number]

export const MAX_OCCURRENCES = 9

/**
 * `TABLE[colour][occurrence - 1]` — the letters that mean "cut".
 *
 * Stored as strings because that is how they are memorized and how the study
 * page renders them: "AC" reads as one chunk, not as a set of two.
 */
export const TABLE: Record<SequenceColor, string[]> = {
  Red: ['C', 'B', 'A', 'AC', 'B', 'AC', 'ABC', 'AB', 'B'],
  Blue: ['B', 'AC', 'B', 'A', 'B', 'BC', 'C', 'AC', 'A'],
  Black: ['ABC', 'AC', 'B', 'AC', 'B', 'BC', 'AB', 'C', 'C'],
}

/**
 * Should this wire be cut?
 *
 * `occurrence` is 1-indexed and counts that colour across the whole module,
 * not the current panel.
 */
export function shouldCut(color: SequenceColor, occurrence: number, letter: Letter): boolean {
  const row = TABLE[color][occurrence - 1]
  if (row === undefined) {
    throw new Error(`${color} wire #${occurrence} is beyond the ${MAX_OCCURRENCES}-row table`)
  }
  return row.includes(letter)
}

/** The letters that mean "cut" for a given occurrence. */
export function cutLetters(color: SequenceColor, occurrence: number): Letter[] {
  const row = TABLE[color][occurrence - 1]
  if (row === undefined) throw new Error(`No row ${occurrence} for ${color}`)
  return LETTERS.filter((l) => row.includes(l))
}

/**
 * The chunks the study page teaches, as Robert grouped them.
 *
 * Each entry is a slice of the nine rows plus the reason it hangs together.
 * Kept beside the table so a change to one is visibly a change to the other.
 */
export const CHUNKS: Record<SequenceColor, { rows: string[]; note: string }[]> = {
  Red: [
    { rows: ['C', 'B', 'A'], note: 'Pretty straightforward.' },
    {
      rows: ['AC', 'B', 'AC'],
      note: "A sandwich — blue's first chunk with AC and B swapped.",
    },
    {
      rows: ['ABC', 'AB', 'B'],
      note: 'The last row is B, and you get there from AC one letter at a time: add B, drop C, drop A.',
    },
  ],
  Blue: [
    { rows: ['B', 'AC', 'B'], note: 'A sandwich: the outsides are B, the inside is everything except B.' },
    { rows: ['A', 'B', 'BC', 'C'], note: 'ABC, except BC sits between B and C.' },
    {
      rows: ['AC', 'A'],
      note: 'The last row is A, reached from C one letter at a time: add A, drop C.',
    },
  ],
  Black: [
    { rows: ['ABC'], note: 'First one is anything.' },
    { rows: ['AC', 'B', 'AC', 'B'], note: "It's AC, B twice." },
    {
      rows: ['BC', 'AB', 'C', 'C'],
      note: 'Two options for Calc — BC and AB — and you get a C in both of them.',
    },
  ],
}
