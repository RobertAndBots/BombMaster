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
  },
  {
    href: 'https://www.reddit.com/r/ktane/comments/465x6w/how_to_learn_complex_modules_wire_sequences_whos/',
    label: 'How to learn complex modules',
  },
] as const
