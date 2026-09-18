import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  ALL_DISPLAY_WORDS,
  BLANK_DISPLAY,
  GROUP_1,
  GROUP_2,
  generate,
  groupOf,
  MAX_USEFUL_DEPTH,
  POSITION_OF,
  POSITIONS,
  pressIndexFor,
  readPosition,
  solve,
  studyList,
  WORD_LISTS,
  type ButtonLabel,
} from './whos-on-first'

/** Every legal 6-button module from `group` that includes `label`. */
function* modulesContaining(group: readonly ButtonLabel[], label: ButtonLabel) {
  // Iterative C(13,5) enumeration of the other five buttons.
  const others = group.filter((w) => w !== label)
  const n = others.length
  const idx = [0, 1, 2, 3, 4]
  while (true) {
    yield [label, ...idx.map((i) => others[i]!)]
    let i = 4
    while (i >= 0 && idx[i]! === n - 5 + i) i--
    if (i < 0) return
    idx[i]!++
    for (let j = i + 1; j < 5; j++) idx[j] = idx[j - 1]! + 1
  }
}

describe('data integrity', () => {
  it('there are exactly 28 display words across six positions', () => {
    expect(ALL_DISPLAY_WORDS).toHaveLength(28)
    expect(new Set(ALL_DISPLAY_WORDS).size).toBe(28)
    expect(POSITIONS).toHaveLength(6)
  })

  it('the blank display maps to Bottom Left', () => {
    expect(readPosition(BLANK_DISPLAY)).toBe(POSITIONS.indexOf('Bottom Left'))
  })

  it('every display word maps to a real position', () => {
    for (const word of ALL_DISPLAY_WORDS) {
      const pos = POSITION_OF[word]
      expect(pos).toBeGreaterThanOrEqual(0)
      expect(pos).toBeLessThan(6)
    }
  })

  it('the two groups are disjoint and cover 28 labels', () => {
    expect(GROUP_1).toHaveLength(14)
    expect(GROUP_2).toHaveLength(14)
    const all = new Set<string>([...GROUP_1, ...GROUP_2])
    expect(all.size).toBe(28)
  })

  it('every word list is a permutation of its own group', () => {
    for (const label of [...GROUP_1, ...GROUP_2] as ButtonLabel[]) {
      const list = WORD_LISTS[label]
      expect(list, `${label} list length`).toHaveLength(14)
      expect(new Set(list).size, `${label} has duplicates`).toBe(14)
      expect([...list].sort()).toEqual([...groupOf(label)].sort())
    }
  })

  it('every label has a word list', () => {
    for (const label of [...GROUP_1, ...GROUP_2] as ButtonLabel[]) {
      expect(WORD_LISTS[label]).toBeDefined()
    }
  })
})

/**
 * The claim the study page makes: you only have to memorize the first nine
 * entries, and you can stop early at the label's own word.
 *
 * This enumerates EVERY legal module — all 28 labels x C(13,5) button sets —
 * and checks the truncated list picks the same button as the full one. If the
 * shortcut were ever wrong, this finds the exact case.
 */
describe('the memorization shortcut is sound', () => {
  it('the truncated list always picks the same button as the full list', () => {
    let checked = 0
    for (const group of [GROUP_1, GROUP_2] as const) {
      for (const label of group as readonly ButtonLabel[]) {
        const short = studyList(label)
        for (const buttons of modulesContaining(group as readonly ButtonLabel[], label)) {
          const full = pressIndexFor(label, buttons)
          const truncated = short.findIndex((w) => buttons.includes(w))
          expect(truncated, `${label} ran off the end of its study list`).toBeGreaterThanOrEqual(0)
          expect(buttons.indexOf(short[truncated]!), `${label} / ${buttons.join(',')}`).toBe(full)
          checked++
        }
      }
    }
    // 28 labels x C(13,5) = 28 x 1287
    expect(checked).toBe(28 * 1287)
  })

  it('no study list is longer than nine words', () => {
    for (const label of [...GROUP_1, ...GROUP_2] as ButtonLabel[]) {
      expect(studyList(label).length).toBeLessThanOrEqual(MAX_USEFUL_DEPTH)
    }
  })

  it('a study list that stops early ends on the label itself', () => {
    for (const label of [...GROUP_1, ...GROUP_2] as ButtonLabel[]) {
      const short = studyList(label)
      if (short.length < MAX_USEFUL_DEPTH) expect(short[short.length - 1]).toBe(label)
    }
  })
})

describe('manual spot checks', () => {
  it('step 1: "UR" reads the top-left button', () => {
    expect(readPosition('UR')).toBe(0)
  })

  it('step 1: the homophone traps land in different places', () => {
    expect(readPosition('Lead')).toBe(POSITIONS.indexOf('Bottom Right'))
    expect(readPosition('Led')).toBe(POSITIONS.indexOf('Middle Left'))
    expect(readPosition('Leed')).toBe(POSITIONS.indexOf('Bottom Left'))
  })

  it('step 1: "You are" and "You" differ', () => {
    expect(readPosition('You')).toBe(POSITIONS.indexOf('Middle Right'))
    expect(readPosition('You are')).toBe(POSITIONS.indexOf('Bottom Right'))
  })

  it('step 2: "Left" presses Right when both are present', () => {
    const buttons: ButtonLabel[] = ['Left', 'Right', 'Yes', 'No', 'Wait', 'Press']
    expect(buttons[pressIndexFor('Left', buttons)]).toBe('Right')
  })

  it('step 2: "Left" presses itself when Right is absent', () => {
    const buttons: ButtonLabel[] = ['Left', 'Yes', 'No', 'Wait', 'Press', 'Okay']
    expect(buttons[pressIndexFor('Left', buttons)]).toBe('Left')
  })

  it('step 2: "Uh huh" is its own first entry, so it always presses itself', () => {
    const buttons: ButtonLabel[] = ['Uh huh', 'You', 'Your', 'UR', 'U', 'Done']
    expect(buttons[pressIndexFor('Uh huh', buttons)]).toBe('Uh huh')
  })

  it('an unknown display word is rejected rather than guessed', () => {
    expect(() => readPosition('Banana')).toThrow()
  })

  it('solves end to end', () => {
    // Display "UR" -> read top-left -> that button says "Ready" -> press Yes.
    const module = {
      display: 'UR',
      buttons: ['Ready', 'First', 'Yes', 'No', 'Blank', 'Wait'] as ButtonLabel[],
    }
    expect(module.buttons[solve(module)]).toBe('Yes')
  })
})

describe('generate', () => {
  it('always produces a solvable module from a single group', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const module = generate(seeded(seed))
      expect(module.buttons).toHaveLength(6)
      expect(new Set(module.buttons).size).toBe(6)

      const group = groupOf(module.buttons[0]!)
      for (const b of module.buttons) expect(group).toContain(b)

      const idx = solve(module)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(6)
    }
  })

  it('uses both groups and reaches every read position', () => {
    const positions = new Set<number>()
    const groups = new Set<string>()
    for (let seed = 0; seed < 1000; seed++) {
      const module = generate(seeded(seed))
      positions.add(readPosition(module.display))
      groups.add(groupOf(module.buttons[0]!) === GROUP_1 ? '1' : '2')
    }
    expect(positions.size).toBe(6)
    expect(groups.size).toBe(2)
  })
})
