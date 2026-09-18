import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  generate,
  matchingSets,
  occurrences,
  SETS,
  sharedSymbols,
  solve,
  SYMBOL_NAMES,
  SYMBOLS_PER_MODULE,
  uniqueSymbols,
} from './keypads'

describe('data integrity', () => {
  it('six columns of seven symbols', () => {
    expect(SETS).toHaveLength(6)
    for (const set of SETS) expect(set.symbols).toHaveLength(7)
  })

  it('every mnemonic has one word per symbol', () => {
    for (const set of SETS) expect(set.mnemonic).toHaveLength(set.symbols.length)
  })

  it('no column repeats a symbol', () => {
    for (const set of SETS) expect(new Set(set.symbols).size).toBe(7)
  })

  it('uses exactly 27 distinct symbols', () => {
    expect(occurrences().size).toBe(27)
  })

  it('12 symbols appear once and 15 appear twice — the study page claim', () => {
    expect(uniqueSymbols()).toHaveLength(12)
    expect(sharedSymbols()).toHaveLength(15)
    for (const [, n] of occurrences()) expect(n).toBeLessThanOrEqual(2)
  })

  it('every symbol has a display name and an image id', () => {
    for (const [symbol] of occurrences()) {
      expect(SYMBOL_NAMES[symbol], `${symbol} has no name`).toBeDefined()
    }
  })
})

describe('solve', () => {
  it('orders symbols by their column position', () => {
    // Column 1 order: magnify, at, lambda, lightning, yield, hj, revc
    expect(solve(['hj', 'at', 'revc', 'magnify'])).toEqual(['magnify', 'at', 'hj', 'revc'])
  })

  it('a unique symbol pins the column', () => {
    // `omega` only appears in column 6.
    expect(solve(['omega', 'six', 'reve'])).toEqual(['six', 'reve', 'omega'])
  })

  it('rejects an impossible combination rather than guessing', () => {
    // `at` is column 1 only, `omega` is column 6 only.
    expect(() => solve(['at', 'omega'])).toThrow(/No column/)
  })

  it('rejects an ambiguous combination', () => {
    // magnify, revc and hj all appear in both column 1 and column 2.
    expect(matchingSets(['magnify', 'revc', 'hj']).length).toBeGreaterThan(1)
    expect(() => solve(['magnify', 'revc', 'hj'])).toThrow(/Ambiguous/)
  })
})

describe('generate', () => {
  it('always produces an unambiguous, solvable module', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const module = generate(seeded(seed))
      expect(module.symbols).toHaveLength(SYMBOLS_PER_MODULE)
      expect(new Set(module.symbols).size).toBe(SYMBOLS_PER_MODULE)
      expect(matchingSets(module.symbols)).toEqual([module.setIndex])

      const ordered = solve(module.symbols)
      expect([...ordered].sort()).toEqual([...module.symbols].sort())
    }
  })

  it('the answer is a real ordering of the drawn symbols', () => {
    for (let seed = 0; seed < 300; seed++) {
      const module = generate(seeded(seed))
      const set = SETS[module.setIndex]!
      const ordered = solve(module.symbols)
      const positions = ordered.map((s) => set.symbols.indexOf(s))
      // Strictly increasing = correctly ordered.
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]!).toBeGreaterThan(positions[i - 1]!)
      }
    }
  })

  it('draws from every column', () => {
    const seen = new Set<number>()
    for (let seed = 0; seed < 500; seed++) seen.add(generate(seeded(seed)).setIndex)
    expect(seen.size).toBe(SETS.length)
  })
})
