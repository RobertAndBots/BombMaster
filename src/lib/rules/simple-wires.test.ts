import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  CONDITIONS,
  conditionIndex,
  generate,
  generateForCondition,
  solve,
  solvePosition,
  WIRE_COLORS,
  type WireConfig,
} from './simple-wires'

/**
 * The property that matters: the generator and the solver must agree.
 *
 * `generateForCondition(n, i)` claims "this bomb is decided by row i". If the
 * solver reads the same bomb and lands on a different row, then either the
 * generator's constraint search or the table itself is wrong — and on the old
 * site nothing would have caught it, because the two lived in the same
 * component and were never compared.
 */
describe('generator and solver agree', () => {
  for (const numWires of [3, 4, 5, 6]) {
    const conds = CONDITIONS[numWires]!
    for (let trueIdx = 0; trueIdx < conds.length; trueIdx++) {
      it(`${numWires} wires, condition ${trueIdx} fires as intended`, () => {
        for (let seed = 0; seed < 200; seed++) {
          const config = generateForCondition(seeded(seed), numWires, trueIdx)
          expect(config.wires).toHaveLength(numWires)
          expect(conditionIndex(config)).toBe(trueIdx)
        }
      })
    }
  }
})

describe('generate', () => {
  it('always produces a solvable module', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const config = generate(seeded(seed))
      expect(config.wires.length).toBeGreaterThanOrEqual(3)
      expect(config.wires.length).toBeLessThanOrEqual(6)
      const pos = solvePosition(config)
      expect(pos).toBeGreaterThanOrEqual(1)
      expect(pos).toBeLessThanOrEqual(config.wires.length)
    }
  })

  it('reaches every condition of every wire count', () => {
    const seen = new Set<string>()
    for (let seed = 0; seed < 3000; seed++) {
      const config = generate(seeded(seed))
      seen.add(`${config.wires.length}:${conditionIndex(config)}`)
    }
    for (const [numWires, conds] of Object.entries(CONDITIONS)) {
      for (let i = 0; i < conds.length; i++) {
        expect(seen.has(`${numWires}:${i}`)).toBe(true)
      }
    }
  })

  it('is deterministic for a given seed', () => {
    expect(generate(seeded(42))).toEqual(generate(seeded(42)))
  })
})

/**
 * Spot-checks transcribed straight from the manual. These are the backstop
 * against a typo in CONDITIONS — the generator/solver agreement test above
 * would happily pass with a consistently wrong table.
 */
describe('manual spot checks', () => {
  const cfg = (wires: string, odd = false): WireConfig => ({
    wires: wires.split('') as WireConfig['wires'],
    odd,
  })

  it('3 wires: no red -> cut the second wire', () => {
    expect(solve(cfg('UWB'))).toBe(2)
  })

  it('3 wires: last wire white -> cut the last wire', () => {
    expect(solve(cfg('RUW'))).toBe(3)
  })

  it('3 wires: more than one blue -> cut the last blue wire', () => {
    expect(solvePosition(cfg('RUU'))).toBe(3)
    expect(solvePosition(cfg('UUR'))).toBe(2)
  })

  it('3 wires: otherwise cut the last wire', () => {
    expect(solve(cfg('RBB'))).toBe(3)
  })

  it('4 wires: more than one red and odd serial -> cut the last red wire', () => {
    expect(solvePosition(cfg('RWRB', true))).toBe(3)
  })

  it('4 wires: last wire yellow and no red -> cut the first wire', () => {
    expect(solve(cfg('UWBY'))).toBe(1)
  })

  it('4 wires: exactly one blue -> cut the first wire', () => {
    expect(solve(cfg('WUBR'))).toBe(1)
  })

  it('4 wires: more than one yellow -> cut the fourth wire', () => {
    expect(solve(cfg('YYBW'))).toBe(4)
  })

  it('4 wires: otherwise cut the second wire', () => {
    expect(solve(cfg('WWBB'))).toBe(2)
  })

  it('5 wires: last wire black and odd serial -> cut the fourth wire', () => {
    expect(solve(cfg('RWUYB', true))).toBe(4)
  })

  it('5 wires: one red and more than one yellow -> cut the first wire', () => {
    expect(solve(cfg('RYYWU'))).toBe(1)
  })

  it('5 wires: no black -> cut the second wire', () => {
    expect(solve(cfg('RRWUY'))).toBe(2)
  })

  it('5 wires: otherwise cut the first wire', () => {
    expect(solve(cfg('BBWWU'))).toBe(1)
  })

  it('6 wires: no yellow and odd serial -> cut the third wire', () => {
    expect(solve(cfg('RRUUWB', true))).toBe(3)
  })

  it('6 wires: one yellow and more than one white -> cut the fourth wire', () => {
    expect(solve(cfg('YWWBRU'))).toBe(4)
  })

  it('6 wires: no red -> cut the sixth wire', () => {
    expect(solve(cfg('YYUUWB'))).toBe(6)
  })

  it('6 wires: otherwise cut the fourth wire', () => {
    expect(solve(cfg('RYYWWB'))).toBe(4)
  })

  it('checks conditions in order — an earlier row wins', () => {
    // No red (row 1) AND last wire white (row 2) both hold; row 1 must win.
    expect(solve(cfg('UBW'))).toBe(2)
  })
})

describe('table integrity', () => {
  it('every wire count has a final catch-all with no colour requirement', () => {
    for (const conds of Object.values(CONDITIONS)) {
      const last = conds[conds.length - 1]!
      expect(Object.keys(last)).toEqual(['cut'])
    }
  })

  it('every cut target is a valid position or a real colour', () => {
    for (const [numWires, conds] of Object.entries(CONDITIONS)) {
      for (const cond of conds) {
        if (typeof cond.cut === 'number') {
          expect(cond.cut).toBeGreaterThanOrEqual(1)
          expect(cond.cut).toBeLessThanOrEqual(Number(numWires))
        } else {
          expect(WIRE_COLORS).toContain(cond.cut)
        }
      }
    }
  })
})
