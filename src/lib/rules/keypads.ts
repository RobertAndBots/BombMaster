/**
 * Keypads — manual p7.
 *
 * Six columns of seven symbols; a module shows four symbols that all belong to
 * exactly one column, and you press them in that column's order.
 *
 * 27 distinct symbols across 42 slots, so 15 symbols appear in two columns and
 * 12 appear in exactly one. Spotting one of those 12 identifies the column
 * immediately, which is the first thing the study page teaches.
 */
import { shuffle, rnd, type Rng } from '../rng'

/** Symbol ids. Each is a file at `/symbols/<id>.png`. */
export const SYMBOL_NAMES: Record<string, string> = {
  ae: 'AE',
  at: 'AT',
  bt: 'BT',
  cdot: 'C Dot',
  comma: 'Comma',
  copy: 'Copy',
  emptystar: 'Empty Star',
  filledstar: 'Filled Star',
  hj: 'HJ',
  lambda: 'Lambda',
  lightning: 'Lightning',
  loopty: 'Loopty',
  magnify: 'Magnify',
  mirroredk: 'Mirrored K',
  notequals: 'Not Equal',
  omega: 'Omega',
  paragraph: 'Paragraph',
  questionmark: 'Question',
  revc: 'Rev C',
  reve: 'Rev E',
  revn: 'Rev N',
  six: 'Six',
  smiley: 'Smiley',
  threeears: '3 Ears',
  threefizzle: '3 Fizzle',
  trident: 'Trident',
  yield: 'Yield',
}

export type SymbolId = string

/**
 * The six columns, in manual order, each with Robert's mnemonic.
 *
 * The mnemonic words line up one-to-one with the symbols, so reciting the
 * sentence gives you the press order — which is the whole trick.
 */
export type KeypadSet = {
  symbols: SymbolId[]
  mnemonic: string[]
}

export const SETS: KeypadSet[] = [
  {
    symbols: ['magnify', 'at', 'lambda', 'lightning', 'yield', 'hj', 'revc'],
    mnemonic: ['Look', 'at', 'lamb', 'light,', 'stop', 'his', 'cat'],
  },
  {
    symbols: ['reve', 'magnify', 'revc', 'loopty', 'emptystar', 'hj', 'questionmark'],
    mnemonic: ['Ey', 'look', 'see', 'shooting', 'star', 'huh', '?'],
  },
  {
    symbols: ['copy', 'comma', 'loopty', 'mirroredk', 'threefizzle', 'lambda', 'emptystar'],
    mnemonic: ['Cops', 'will', 'circle', 'my', 'three', 'lamb', 'stars'],
  },
  {
    symbols: ['six', 'paragraph', 'bt', 'yield', 'mirroredk', 'questionmark', 'smiley'],
    mnemonic: ['Six', 'par-', 'ties', 'stop', 'my', 'questions', 'happily'],
  },
  {
    symbols: ['trident', 'smiley', 'bt', 'cdot', 'paragraph', 'threeears', 'filledstar'],
    mnemonic: ['Try', 'smiling', 'be-', 'cause', 'par', 'three', 'stars'],
  },
  {
    symbols: ['six', 'reve', 'notequals', 'ae', 'trident', 'revn', 'omega'],
    mnemonic: ['Sax-', 'E (saxy)', 'not', 'a', 'try', 'no-', 'mega'],
  },
]

export const SYMBOLS_PER_MODULE = 4

/** How many columns each symbol appears in. */
export function occurrences(): Map<SymbolId, number> {
  const counts = new Map<SymbolId, number>()
  for (const set of SETS) {
    for (const s of set.symbols) counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  return counts
}

/** The 12 symbols that identify their column on sight. */
export function uniqueSymbols(): SymbolId[] {
  return [...occurrences()].filter(([, n]) => n === 1).map(([s]) => s)
}

/** The 15 symbols that appear in two columns. */
export function sharedSymbols(): SymbolId[] {
  return [...occurrences()].filter(([, n]) => n > 1).map(([s]) => s)
}

// ---- solving ---------------------------------------------------------------

/** Indices of every column that contains all of `symbols`. */
export function matchingSets(symbols: SymbolId[]): number[] {
  return SETS.map((set, idx) => (symbols.every((s) => set.symbols.includes(s)) ? idx : -1)).filter(
    (idx) => idx >= 0,
  )
}

/**
 * The symbols in press order.
 *
 * Throws when the input is ambiguous rather than picking a column — a real
 * module always resolves to exactly one, so ambiguity means the caller built
 * something the game could not produce.
 */
export function solve(symbols: SymbolId[]): SymbolId[] {
  const matches = matchingSets(symbols)
  if (matches.length === 0) throw new Error('No column contains all of these symbols')
  if (matches.length > 1) throw new Error('Ambiguous: more than one column matches')

  const set = SETS[matches[0]!]!
  return [...symbols].sort((a, b) => set.symbols.indexOf(a) - set.symbols.indexOf(b))
}

// ---- generating ------------------------------------------------------------

export type KeypadModule = {
  /** Four symbols, in the scrambled order they appear on the module. */
  symbols: SymbolId[]
  /** Which column they came from. */
  setIndex: number
}

/**
 * Draw four symbols from one column.
 *
 * Redraws when the four also fit a second column. That is not defensive
 * padding: two columns share up to three symbols, so an ambiguous draw is
 * genuinely reachable, and a drill that served one would have no correct
 * answer.
 */
export function generate(rng: Rng): KeypadModule {
  for (let attempt = 0; attempt < 100; attempt++) {
    const setIndex = rnd(rng, SETS.length)
    const symbols = shuffle(rng, SETS[setIndex]!.symbols).slice(0, SYMBOLS_PER_MODULE)
    if (matchingSets(symbols).length === 1) return { symbols, setIndex }
  }
  throw new Error('Could not draw an unambiguous keypad module')
}
