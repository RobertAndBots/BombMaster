/**
 * Tests for the four modules that are tables rather than simulations.
 *
 * These have no generator to check against, so the tests do two other things:
 * assert structural facts the manual guarantees, and assert the *observations*
 * the study pages teach. If a mnemonic on a page stops being true of the data,
 * a test here fails rather than the page quietly lying.
 */
import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  COLORS,
  MAPPINGS,
  MAX_STRIKES,
  generate as generateSimon,
  mappingFor,
  solve as solveSimon,
  solveSequence,
  type Color,
} from './simon-says'
import {
  CHUNKS,
  LETTERS,
  MAX_OCCURRENCES,
  SEQUENCE_COLORS,
  TABLE,
  cutLetters,
  shouldCut as shouldCutSequence,
} from './wire-sequences'
import {
  CHART,
  COMBOS,
  INSTRUCTIONS,
  WIRE_KINDS,
  combinationsFor,
  instructionFor,
  shouldCut as shouldCutComplicated,
  type Instruction,
} from './complicated-wires'
import { GROUPS, MORSE, WORDS, encode, frequencyOf } from './morse-code'

describe('simon says', () => {
  it('every table maps all four colours to a real colour', () => {
    for (const table of Object.values(MAPPINGS)) {
      expect(table).toHaveLength(MAX_STRIKES + 1)
      for (const mapping of table) {
        for (const c of COLORS) expect(COLORS).toContain(mapping[c])
      }
    }
  })

  it('every mapping is a bijection — no two flashes share a button', () => {
    for (const table of Object.values(MAPPINGS)) {
      for (const mapping of table) {
        expect(new Set(Object.values(mapping)).size).toBe(COLORS.length)
      }
    }
  })

  it('caps the strike lookup at 2', () => {
    expect(mappingFor(true, 5)).toEqual(mappingFor(true, MAX_STRIKES))
  })

  // The manual's tables, re-stated as the study page's mnemonics. A mnemonic
  // that stops describing the data fails here.
  it('vowel + no strikes: red/blue swap and green/yellow swap', () => {
    const m = mappingFor(true, 0)
    expect(m).toEqual({ Red: 'Blue', Blue: 'Red', Green: 'Yellow', Yellow: 'Green' })
  })

  it('no vowel + no strikes: red/blue/yellow rotate, green stays', () => {
    const m = mappingFor(false, 0)
    expect(m).toEqual({ Red: 'Blue', Blue: 'Yellow', Green: 'Green', Yellow: 'Red' })
  })

  /**
   * This is the case the OLD site got wrong. It claimed blue, yellow and green
   * rotate with red fixed; the manual has red AND blue fixed with green and
   * yellow swapping. Pinned here so it cannot regress.
   */
  it('no vowel + 1 strike: red and blue stay, green/yellow swap', () => {
    const m = mappingFor(false, 1)
    expect(m).toEqual({ Red: 'Red', Blue: 'Blue', Green: 'Yellow', Yellow: 'Green' })
    expect(m.Blue).not.toBe('Green')
  })

  it('vowel + 1 strike and no vowel + 2 strikes are the same table', () => {
    expect(mappingFor(true, 1)).toEqual(mappingFor(false, 2))
    expect(mappingFor(true, 1)).toEqual({
      Red: 'Yellow',
      Blue: 'Green',
      Green: 'Blue',
      Yellow: 'Red',
    })
  })

  it('vowel + 2 strikes rotates red -> green -> yellow -> blue -> red', () => {
    const m = mappingFor(true, 2)
    expect(m).toEqual({ Red: 'Green', Green: 'Yellow', Yellow: 'Blue', Blue: 'Red' })
  })

  it('solves sequences one flash at a time', () => {
    const flashes: Color[] = ['Red', 'Green', 'Red']
    expect(solveSequence(flashes, true, 0)).toEqual(['Blue', 'Yellow', 'Blue'])
    expect(flashes.map((f) => solveSimon(f, true, 0))).toEqual(solveSequence(flashes, true, 0))
  })

  it('generates rounds within the legal strike range', () => {
    for (let seed = 0; seed < 200; seed++) {
      const round = generateSimon(seeded(seed))
      expect(round.strikes).toBeGreaterThanOrEqual(0)
      expect(round.strikes).toBeLessThanOrEqual(MAX_STRIKES)
      expect(round.flashes.length).toBeGreaterThan(0)
      expect(() => solveSequence(round.flashes, round.hasVowel, round.strikes)).not.toThrow()
    }
  })
})

describe('wire sequences', () => {
  it('nine rows per colour, each a subset of ABC', () => {
    for (const color of SEQUENCE_COLORS) {
      expect(TABLE[color]).toHaveLength(MAX_OCCURRENCES)
      for (const row of TABLE[color]) {
        expect(row.length).toBeGreaterThan(0)
        for (const letter of row) expect(LETTERS).toContain(letter)
        expect(new Set(row).size).toBe(row.length)
      }
    }
  })

  it('cutLetters agrees with shouldCut', () => {
    for (const color of SEQUENCE_COLORS) {
      for (let occ = 1; occ <= MAX_OCCURRENCES; occ++) {
        for (const letter of LETTERS) {
          expect(shouldCutSequence(color, occ, letter)).toBe(cutLetters(color, occ).includes(letter))
        }
      }
    }
  })

  it('rejects an occurrence past the ninth', () => {
    expect(() => shouldCutSequence('Red', 10, 'A')).toThrow()
  })

  it('manual spot checks', () => {
    expect(shouldCutSequence('Red', 1, 'C')).toBe(true)
    expect(shouldCutSequence('Red', 1, 'A')).toBe(false)
    expect(shouldCutSequence('Black', 1, 'A')).toBe(true) // first black is A, B or C
    expect(shouldCutSequence('Blue', 9, 'A')).toBe(true)
    expect(shouldCutSequence('Blue', 9, 'C')).toBe(false)
  })

  // The three observations the study page teaches.
  it('the fifth row is B for every colour', () => {
    for (const color of SEQUENCE_COLORS) expect(TABLE[color][4]).toBe('B')
  })

  it('blue and black share rows 2 and 3; red and black share rows 4 and 5', () => {
    expect(TABLE.Blue.slice(1, 3)).toEqual(TABLE.Black.slice(1, 3))
    expect(TABLE.Red.slice(3, 5)).toEqual(TABLE.Black.slice(3, 5))
  })

  it('the last row differs for every colour: B, A, C', () => {
    expect([TABLE.Red[8], TABLE.Blue[8], TABLE.Black[8]]).toEqual(['B', 'A', 'C'])
  })

  it('the chunks reassemble into exactly the table', () => {
    for (const color of SEQUENCE_COLORS) {
      expect(CHUNKS[color].flatMap((c) => c.rows)).toEqual(TABLE[color])
    }
  })

  /**
   * Both are three-row sandwiches, and one is the other with AC and B swapped.
   * Worth pinning because it is easy to misread as a sequence reversal — they
   * are both palindromes, so reversing either changes nothing.
   */
  it("red's second chunk is blue's first with AC and B swapped", () => {
    const swap = (rows: string[]) => rows.map((r) => (r === 'AC' ? 'B' : r === 'B' ? 'AC' : r))
    expect(CHUNKS.Red[1]!.rows).toEqual(swap(CHUNKS.Blue[0]!.rows))
    // Both are palindromes, which is what makes "sandwich" the right word.
    for (const rows of [CHUNKS.Red[1]!.rows, CHUNKS.Blue[0]!.rows]) {
      expect(rows).toEqual([...rows].reverse())
    }
  })
})

describe('complicated wires', () => {
  it('four wire kinds x four LED/star combinations', () => {
    expect(WIRE_KINDS).toHaveLength(4)
    expect(COMBOS).toHaveLength(4)
    for (const kind of WIRE_KINDS) expect(CHART[kind]).toHaveLength(4)
  })

  /**
   * The manual draws this as a Venn diagram with 16 regions. Counting how many
   * regions carry each letter is an independent check on the table: a
   * mis-transcribed cell changes two counts at once.
   */
  it('instruction counts match the manual Venn diagram (C3 D3 S4 P3 B3)', () => {
    const counts: Record<Instruction, number> = { C: 0, D: 0, S: 0, P: 0, B: 0 }
    for (const kind of WIRE_KINDS) for (const i of CHART[kind]) counts[i]++
    expect(counts).toEqual({ C: 3, D: 3, S: 4, P: 3, B: 3 })
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(16)
  })

  it('every cell is a known instruction', () => {
    for (const kind of WIRE_KINDS) {
      for (const i of CHART[kind]) expect(INSTRUCTIONS[i]).toBeDefined()
    }
  })

  it('manual spot checks', () => {
    expect(instructionFor({ kind: 'White', led: false, star: false })).toBe('C')
    expect(instructionFor({ kind: 'White', led: true, star: false })).toBe('D')
    expect(instructionFor({ kind: 'White', led: true, star: true })).toBe('B')
    expect(instructionFor({ kind: 'Red', led: false, star: true })).toBe('C')
    expect(instructionFor({ kind: 'Blue', led: true, star: true })).toBe('P')
    expect(instructionFor({ kind: 'RedBlue', led: true, star: true })).toBe('D')
  })

  it('applies the bomb state to conditional instructions', () => {
    const wire = { kind: 'Red' as const, led: false, star: false } // S
    expect(shouldCutComplicated(wire, { serialEven: true, parallelPort: false, batteries: 0 })).toBe(true)
    expect(shouldCutComplicated(wire, { serialEven: false, parallelPort: false, batteries: 0 })).toBe(false)

    const blue = { kind: 'Blue' as const, led: true, star: false } // P
    expect(shouldCutComplicated(blue, { serialEven: false, parallelPort: true, batteries: 0 })).toBe(true)

    const white = { kind: 'White' as const, led: true, star: true } // B
    expect(shouldCutComplicated(white, { serialEven: false, parallelPort: false, batteries: 2 })).toBe(true)
    expect(shouldCutComplicated(white, { serialEven: false, parallelPort: false, batteries: 1 })).toBe(false)
  })

  it('the derived combination lists partition all 16 cells', () => {
    const all = (Object.keys(INSTRUCTIONS) as Instruction[]).flatMap(combinationsFor)
    expect(all).toHaveLength(16)
    expect(new Set(all).size).toBe(16)
  })

  it('the study page groupings come out right', () => {
    expect(combinationsFor('C')).toEqual(['White', 'White Star', 'Red Star'])
    expect(combinationsFor('D')).toEqual(['LED White', 'Blue Star', 'LED Red & Blue Star'])
  })
})

describe('morse code', () => {
  it('has the manual\'s sixteen words in order', () => {
    expect(WORDS).toHaveLength(16)
    expect(WORDS[0]!.word).toBe('shell')
    expect(WORDS[15]!.word).toBe('beats')
  })

  it('frequencies are strictly increasing, which is what makes stepping work', () => {
    for (let i = 1; i < WORDS.length; i++) {
      expect(Number(WORDS[i]!.frequency)).toBeGreaterThan(Number(WORDS[i - 1]!.frequency))
    }
  })

  it('spot checks against the manual', () => {
    expect(frequencyOf('shell')).toBe('3.505')
    expect(frequencyOf('flick')).toBe('3.555')
    expect(frequencyOf('beats')).toBe('3.600')
  })

  it('rejects a word that is not on the module', () => {
    expect(() => frequencyOf('banana')).toThrow()
  })

  it('the four study groups are exactly the sixteen words in order', () => {
    expect(GROUPS.flat()).toEqual(WORDS.map((w) => w.word))
    for (const group of GROUPS) expect(group).toHaveLength(4)
  })

  it('every letter used by the words has a Morse encoding', () => {
    for (const { word } of WORDS) {
      for (const c of word) expect(MORSE[c], `no Morse for "${c}"`).toBeDefined()
    }
  })

  it('encodes a word', () => {
    expect(encode('sos')).toEqual(['...', '---', '...'])
  })
})
