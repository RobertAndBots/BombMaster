/**
 * Morse Code — manual p12.
 *
 * Sixteen words, each mapped to a frequency. The words are in a fixed order, so
 * knowing the list means you can step the dial rather than recall the number —
 * which is the shortcut the study page teaches.
 */
export type MorseEntry = {
  word: string
  /** MHz, as shown on the module. */
  frequency: string
}

/** In manual order. The index is what makes the step-through trick work. */
export const WORDS: MorseEntry[] = [
  { word: 'shell', frequency: '3.505' },
  { word: 'halls', frequency: '3.515' },
  { word: 'slick', frequency: '3.522' },
  { word: 'trick', frequency: '3.532' },
  { word: 'boxes', frequency: '3.535' },
  { word: 'leaks', frequency: '3.542' },
  { word: 'strobe', frequency: '3.545' },
  { word: 'bistro', frequency: '3.552' },
  { word: 'flick', frequency: '3.555' },
  { word: 'bombs', frequency: '3.565' },
  { word: 'break', frequency: '3.572' },
  { word: 'brick', frequency: '3.575' },
  { word: 'steak', frequency: '3.582' },
  { word: 'sting', frequency: '3.592' },
  { word: 'vector', frequency: '3.595' },
  { word: 'beats', frequency: '3.600' },
]

/** Robert's four groups of four. */
export const GROUPS: string[][] = [
  ['shell', 'halls', 'slick', 'trick'],
  ['boxes', 'leaks', 'strobe', 'bistro'],
  ['flick', 'bombs', 'break', 'brick'],
  ['steak', 'sting', 'vector', 'beats'],
]

export function frequencyOf(word: string): string {
  const entry = WORDS.find((w) => w.word === word)
  if (!entry) throw new Error(`"${word}" is not a Morse Code word`)
  return entry.frequency
}

/** International Morse, for the letters these sixteen words use. */
export const MORSE: Record<string, string> = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
}

export function encode(word: string): string[] {
  return word
    .toLowerCase()
    .split('')
    .map((c) => {
      const code = MORSE[c]
      if (!code) throw new Error(`No Morse for "${c}"`)
      return code
    })
}
