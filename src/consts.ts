/** Everything about "what this site is" that more than one page needs. */

export const SITE = {
  name: 'Keep Talking Handbook',
  shortName: 'KTH',
  tagline: 'Memorize the bomb defusal manual.',
  description:
    'A study guide for memorizing the Keep Talking and Nobody Explodes bomb defusal manual — the tricks I used for each module, and drills to practice them.',
  email: 'keeptalkinghandbook@gmail.com',
  locale: 'en',
} as const

/** The official manual, linked per module by page number. */
export const MANUAL_URL =
  'https://www.bombmanual.com/print/KeepTalkingAndNobodyExplodes-BombDefusalManual-v1.pdf'

export function manualPage(page: number): string {
  return `${MANUAL_URL}#page=${page}`
}

/** Other people's guides, linked from the home page. */
export const EXTERNAL_RESOURCES = [
  {
    href: 'https://www.speedrun.com/ktane/guide/og1el',
    label: "Narwhal's silly memorization tricks",
    note: 'A speedrunner’s take, heavier on mnemonics than mine.',
  },
  {
    href: 'https://www.reddit.com/r/ktane/comments/465x6w/how_to_learn_complex_modules_wire_sequences_whos/',
    label: 'How to learn complex modules',
    note: 'The r/ktane thread on Wire Sequences and Who’s on First.',
  },
  {
    href: 'https://www.bombmanual.com/',
    label: 'The official manual',
    note: 'Print it. Everything here assumes you have it open.',
  },
] as const

/**
 * Difficulty is my opinion about how hard a module is to MEMORIZE, which is
 * not the same as how hard it is to solve with the manual in front of you.
 * Wire Sequences is trivial to look up and miserable to memorize.
 */
export const DIFFICULTY = {
  easy: { label: 'Easy', blurb: 'An afternoon' },
  medium: { label: 'Medium', blurb: 'A few sessions' },
  hard: { label: 'Hard', blurb: 'The long tail' },
} as const

export type Difficulty = keyof typeof DIFFICULTY

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']
