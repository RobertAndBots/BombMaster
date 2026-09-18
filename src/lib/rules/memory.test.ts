import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  generateStage,
  positionOfLabel,
  RULES,
  solve,
  TOTAL_STAGES,
  type Buttons,
  type Digit,
  type Press,
  type Stage,
} from './memory'

const stage = (display: Digit, buttons: Buttons): Stage => ({ display, buttons })

describe('manual spot checks', () => {
  const b: Buttons = [3, 1, 4, 2] // label 3 is in position 1, label 4 in position 3

  it('stage 1: display 1 -> position 2 (the one you have to remember)', () => {
    expect(solve(1, stage(1, b), [])).toBe(2)
  })

  it('stage 1: displays 2-4 -> the matching position', () => {
    expect(solve(1, stage(2, b), [])).toBe(2)
    expect(solve(1, stage(3, b), [])).toBe(3)
    expect(solve(1, stage(4, b), [])).toBe(4)
  })

  it('stage 2: display 1 -> the button labelled 4', () => {
    expect(solve(2, stage(1, b), [{ position: 2, label: 1 }])).toBe(3)
  })

  it('stage 2: displays 2 and 4 -> stage 1 position', () => {
    const history: Press[] = [{ position: 4, label: 2 }]
    expect(solve(2, stage(2, b), history)).toBe(4)
    expect(solve(2, stage(4, b), history)).toBe(4)
  })

  it('stage 2: display 3 -> position 1', () => {
    expect(solve(2, stage(3, b), [{ position: 4, label: 2 }])).toBe(1)
  })

  it('stage 3: display 1 -> stage 2 label, display 2 -> stage 1 label', () => {
    const history: Press[] = [
      { position: 1, label: 2 },
      { position: 3, label: 4 },
    ]
    expect(solve(3, stage(1, b), history)).toBe(positionOfLabel(b, 4))
    expect(solve(3, stage(2, b), history)).toBe(positionOfLabel(b, 2))
  })

  it('stage 3: display 3 -> position 3, display 4 -> label 4', () => {
    const history: Press[] = [
      { position: 1, label: 2 },
      { position: 3, label: 4 },
    ]
    expect(solve(3, stage(3, b), history)).toBe(3)
    expect(solve(3, stage(4, b), history)).toBe(positionOfLabel(b, 4))
  })

  it('stage 4: displays 3 and 4 -> stage 2 position', () => {
    const history: Press[] = [
      { position: 1, label: 2 },
      { position: 4, label: 3 },
      { position: 2, label: 1 },
    ]
    expect(solve(4, stage(3, b), history)).toBe(4)
    expect(solve(4, stage(4, b), history)).toBe(4)
  })

  it('stage 5: displays 3 and 4 are the switched pair', () => {
    const history: Press[] = [
      { position: 1, label: 2 },
      { position: 4, label: 3 },
      { position: 2, label: 1 },
      { position: 3, label: 4 },
    ]
    // display 3 -> stage 4's label (4); display 4 -> stage 3's label (1)
    expect(solve(5, stage(3, b), history)).toBe(positionOfLabel(b, 4))
    expect(solve(5, stage(4, b), history)).toBe(positionOfLabel(b, 1))
  })

  it('stage 5: displays 1 and 2 are their own stages', () => {
    const history: Press[] = [
      { position: 1, label: 2 },
      { position: 4, label: 3 },
      { position: 2, label: 1 },
      { position: 3, label: 4 },
    ]
    expect(solve(5, stage(1, b), history)).toBe(positionOfLabel(b, 2))
    expect(solve(5, stage(2, b), history)).toBe(positionOfLabel(b, 3))
  })
})

describe('label references resolve through the shuffle', () => {
  it('follows the label, not the position it was in', () => {
    const history: Press[] = [{ position: 1, label: 3 }]
    // Stage 3 display 2 says "same LABEL as stage 1" — label 3, now at position 4.
    expect(solve(3, stage(2, [1, 2, 4, 3]), [...history, { position: 2, label: 2 }])).toBe(4)
  })
})

describe('a full five-stage run is always solvable', () => {
  it('never throws and always lands on a real button', () => {
    for (let seed = 0; seed < 500; seed++) {
      const rng = seeded(seed)
      const history: Press[] = []
      for (let s = 1; s <= TOTAL_STAGES; s++) {
        const current = generateStage(rng)
        const position = solve(s, current, history)
        expect(position).toBeGreaterThanOrEqual(1)
        expect(position).toBeLessThanOrEqual(4)
        history.push({ position, label: current.buttons[position - 1]! })
      }
      expect(history).toHaveLength(TOTAL_STAGES)
    }
  })
})

describe('table integrity', () => {
  it('covers all five stages and all four displays', () => {
    for (let s = 1; s <= TOTAL_STAGES; s++) {
      for (const d of [1, 2, 3, 4] as Digit[]) {
        expect(RULES[s]?.[d]).toBeDefined()
      }
    }
  })

  it('never references a stage that has not happened yet', () => {
    for (let s = 1; s <= TOTAL_STAGES; s++) {
      for (const d of [1, 2, 3, 4] as Digit[]) {
        const rule = RULES[s]![d]!
        if (rule.kind === 'stagePosition' || rule.kind === 'stageLabel') {
          expect(rule.stage).toBeLessThan(s)
        }
      }
    }
  })

  it('generated buttons are always a permutation of 1-4', () => {
    for (let seed = 0; seed < 300; seed++) {
      const { buttons } = generateStage(seeded(seed))
      expect([...buttons].sort()).toEqual([1, 2, 3, 4])
    }
  })
})
