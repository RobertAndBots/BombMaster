import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  BUTTON_CONDITIONS,
  conditionIndex,
  generate,
  generateForCondition,
  releaseDigit,
  solve,
  type ButtonConfig,
} from './button'

describe('generator and solver agree', () => {
  for (let target = 0; target < BUTTON_CONDITIONS.length; target++) {
    it(`condition ${target} (${BUTTON_CONDITIONS[target]!.rule}) fires as intended`, () => {
      for (let seed = 0; seed < 300; seed++) {
        const config = generateForCondition(seeded(seed), target)
        expect(conditionIndex(config)).toBe(target)
      }
    })
  }

  it('generate reaches every condition', () => {
    const seen = new Set<number>()
    for (let seed = 0; seed < 2000; seed++) seen.add(conditionIndex(generate(seeded(seed))))
    expect(seen.size).toBe(BUTTON_CONDITIONS.length)
  })
})

describe('manual spot checks', () => {
  const cfg = (o: Partial<ButtonConfig>): ButtonConfig => ({
    color: 'B',
    label: 'Press',
    batteries: 0,
    indicators: [],
    ...o,
  })

  it('blue "Abort" is held', () => {
    expect(solve(cfg({ color: 'U', label: 'Abort' }))).toBe('hold')
  })

  it('"Detonate" with 2+ batteries is tapped', () => {
    expect(solve(cfg({ label: 'Detonate', batteries: 2 }))).toBe('tap')
  })

  it('"Detonate" with only 1 battery falls through', () => {
    expect(conditionIndex(cfg({ label: 'Detonate', batteries: 1 }))).toBe(6)
  })

  it('white button with lit CAR is held', () => {
    expect(solve(cfg({ color: 'W', indicators: ['CAR'] }))).toBe('hold')
  })

  it('3+ batteries with lit FRK is tapped', () => {
    expect(solve(cfg({ batteries: 3, indicators: ['FRK'] }))).toBe('tap')
  })

  it('2 batteries with lit FRK does NOT fire row 3', () => {
    expect(conditionIndex(cfg({ batteries: 2, indicators: ['FRK'] }))).toBe(6)
  })

  it('yellow button is held', () => {
    expect(solve(cfg({ color: 'Y' }))).toBe('hold')
  })

  it('red "Hold" is tapped', () => {
    expect(solve(cfg({ color: 'R', label: 'Hold' }))).toBe('tap')
  })

  it('anything else is held', () => {
    expect(solve(cfg({ color: 'B', label: 'Press' }))).toBe('hold')
  })

  it('FRQ is decoration and changes nothing', () => {
    const without = cfg({ color: 'W', indicators: ['CAR'] })
    const withFrq = cfg({ color: 'W', indicators: ['CAR', 'FRQ'] })
    expect(conditionIndex(withFrq)).toBe(conditionIndex(without))
  })

  it('checks rows in order — blue "Abort" beats the battery rule', () => {
    expect(conditionIndex(cfg({ color: 'U', label: 'Abort', batteries: 5 }))).toBe(0)
  })
})

describe('the study page shortcuts hold', () => {
  it('actions alternate hold/tap starting with hold', () => {
    BUTTON_CONDITIONS.forEach((c, i) => {
      expect(c.action).toBe(i % 2 === 0 ? 'hold' : 'tap')
    })
  })

  it('with fewer than 2 batteries, only red "Hold" is tapped', () => {
    for (let seed = 0; seed < 500; seed++) {
      const config = generate(seeded(seed))
      if (config.batteries >= 2) continue
      const expected = config.color === 'R' && config.label === 'Hold' ? 'tap' : 'hold'
      expect(solve(config)).toBe(expected)
    }
  })
})

describe('release digit', () => {
  it('blue is 4, yellow is 5, everything else is 1', () => {
    expect(releaseDigit('Blue')).toBe(4)
    expect(releaseDigit('Yellow')).toBe(5)
    expect(releaseDigit('Red')).toBe(1)
    expect(releaseDigit('White')).toBe(1)
  })
})
