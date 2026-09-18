/**
 * Who's on First — manual p9-10.
 *
 * Two steps. The display word tells you which of the six buttons to *read*
 * (step 1); that button's label has its own priority list, and you press the
 * first word on that list which appears anywhere on the module (step 2).
 *
 * ── Why the full lists live here ───────────────────────────────────────────
 *
 * The old site stored hand-truncated lists — "at most the first 9 words, and
 * you can stop when you reach the step-1 word itself" — because that is what
 * you actually memorize. That shortcut is sound, but it was *asserted* in
 * prose and hand-applied to 28 lists, which is 28 chances to mis-transcribe.
 *
 * So the canonical data here is the full 14-word lists, and `studyList()`
 * derives the truncation. A test then proves the derived list always picks the
 * same button as the full one, for every legal module. The memorization trick
 * is checked rather than trusted.
 */
import { randomItem, shuffle, type Rng } from '../rng'

export const POSITIONS = [
  'Top Left',
  'Top Right',
  'Middle Left',
  'Middle Right',
  'Bottom Left',
  'Bottom Right',
] as const

export type Position = (typeof POSITIONS)[number]

/** The empty display — the module shows nothing at all. */
export const BLANK_DISPLAY = ''

/** Step 1: every display word, grouped by the button position it points at. */
export const DISPLAY_WORDS: Record<Position, string[]> = {
  'Top Left': ['UR'],
  'Top Right': ['C', 'First', 'Okay'],
  'Middle Left': ['Led', 'Nothing', 'They are', 'Yes'],
  'Middle Right': ['Blank', 'Read', 'Red', 'Their', 'You', 'Your', "You're"],
  'Bottom Left': [BLANK_DISPLAY, 'Leed', 'Reed', "They're"],
  'Bottom Right': [
    'Cee',
    'See',
    'Display',
    'Hold on',
    'Lead',
    'No',
    'Says',
    'There',
    'You are',
  ],
}

/** Display word -> 0-indexed button position. */
export const POSITION_OF: Record<string, number> = {}
POSITIONS.forEach((pos, idx) => {
  for (const word of DISPLAY_WORDS[pos]) POSITION_OF[word] = idx
})

/**
 * The 28 button labels, split into the two halves the module draws from.
 *
 * A module only ever uses one group, which is the single most useful thing to
 * know: recognising one word tells you which 14 you are working with.
 */
export const GROUP_1 = [
  'Ready',
  'First',
  'No',
  'Blank',
  'Nothing',
  'Yes',
  'What',
  'Uhhh',
  'Left',
  'Right',
  'Middle',
  'Okay',
  'Wait',
  'Press',
] as const

export const GROUP_2 = [
  'You',
  'You are',
  'Your',
  "You're",
  'UR',
  'U',
  'Uh huh',
  'Uh uh',
  'What?',
  'Done',
  'Next',
  'Hold',
  'Sure',
  'Like',
] as const

export type ButtonLabel = (typeof GROUP_1)[number] | (typeof GROUP_2)[number]

/**
 * Step 2: the full priority list for each label, highest priority first.
 *
 * Transcribed from the manual. Every list is a permutation of its own group's
 * 14 words — asserted in the tests, which is what catches a dropped or
 * duplicated entry.
 */
export const WORD_LISTS: Record<ButtonLabel, ButtonLabel[]> = {
  Ready: ['Yes', 'Okay', 'What', 'Middle', 'Left', 'Press', 'Right', 'Blank', 'Ready', 'No', 'First', 'Uhhh', 'Nothing', 'Wait'],
  First: ['Left', 'Okay', 'Yes', 'Middle', 'No', 'Right', 'Nothing', 'Uhhh', 'Wait', 'Ready', 'Blank', 'What', 'Press', 'First'],
  No: ['Blank', 'Uhhh', 'Wait', 'First', 'What', 'Ready', 'Right', 'Yes', 'Nothing', 'Left', 'Press', 'Okay', 'No', 'Middle'],
  Blank: ['Wait', 'Right', 'Okay', 'Middle', 'Blank', 'Press', 'Ready', 'Nothing', 'No', 'What', 'Left', 'Uhhh', 'Yes', 'First'],
  Nothing: ['Uhhh', 'Right', 'Okay', 'Middle', 'Yes', 'Blank', 'No', 'Press', 'Left', 'What', 'Wait', 'First', 'Nothing', 'Ready'],
  Yes: ['Okay', 'Right', 'Uhhh', 'Middle', 'First', 'What', 'Press', 'Ready', 'Nothing', 'Yes', 'Left', 'Blank', 'No', 'Wait'],
  What: ['Uhhh', 'What', 'Left', 'Nothing', 'Ready', 'Blank', 'Middle', 'No', 'Okay', 'First', 'Wait', 'Yes', 'Press', 'Right'],
  Uhhh: ['Ready', 'Nothing', 'Left', 'What', 'Okay', 'Yes', 'Right', 'No', 'Press', 'Blank', 'Uhhh', 'Middle', 'Wait', 'First'],
  Left: ['Right', 'Left', 'First', 'No', 'Middle', 'Yes', 'Blank', 'What', 'Uhhh', 'Wait', 'Press', 'Ready', 'Okay', 'Nothing'],
  Right: ['Yes', 'Nothing', 'Ready', 'Press', 'No', 'Wait', 'What', 'Right', 'Middle', 'Left', 'Uhhh', 'Blank', 'Okay', 'First'],
  Middle: ['Blank', 'Ready', 'Okay', 'What', 'Nothing', 'Press', 'No', 'Wait', 'Left', 'Middle', 'Right', 'First', 'Uhhh', 'Yes'],
  Okay: ['Middle', 'No', 'First', 'Yes', 'Uhhh', 'Nothing', 'Wait', 'Okay', 'Left', 'Ready', 'Blank', 'Press', 'What', 'Right'],
  Wait: ['Uhhh', 'No', 'Blank', 'Okay', 'Yes', 'Left', 'First', 'Press', 'What', 'Wait', 'Nothing', 'Ready', 'Right', 'Middle'],
  Press: ['Right', 'Middle', 'Yes', 'Ready', 'Press', 'Okay', 'Nothing', 'Uhhh', 'Blank', 'Left', 'First', 'What', 'No', 'Wait'],

  You: ['Sure', 'You are', 'Your', "You're", 'Next', 'Uh huh', 'UR', 'Hold', 'What?', 'You', 'Uh uh', 'Like', 'Done', 'U'],
  'You are': ['Your', 'Next', 'Like', 'Uh huh', 'What?', 'Done', 'Uh uh', 'Hold', 'You', 'U', "You're", 'Sure', 'UR', 'You are'],
  Your: ['Uh uh', 'You are', 'Uh huh', 'Your', 'Next', 'UR', 'Sure', 'U', "You're", 'You', 'What?', 'Hold', 'Like', 'Done'],
  "You're": ['You', "You're", 'UR', 'Next', 'Uh uh', 'You are', 'U', 'Your', 'What?', 'Uh huh', 'Sure', 'Done', 'Like', 'Hold'],
  UR: ['Done', 'U', 'UR', 'Uh huh', 'What?', 'Sure', 'Your', 'Hold', "You're", 'Like', 'Next', 'Uh uh', 'You are', 'You'],
  U: ['Uh huh', 'Sure', 'Next', 'What?', "You're", 'UR', 'Uh uh', 'Done', 'U', 'You', 'Like', 'Hold', 'You are', 'Your'],
  'Uh huh': ['Uh huh', 'Your', 'You are', 'You', 'Done', 'Hold', 'Uh uh', 'Next', 'Sure', 'Like', "You're", 'UR', 'U', 'What?'],
  'Uh uh': ['UR', 'U', 'You are', "You're", 'Next', 'Uh uh', 'Done', 'You', 'Uh huh', 'Like', 'Your', 'Sure', 'Hold', 'What?'],
  'What?': ['You', 'Hold', "You're", 'Your', 'U', 'Done', 'Uh uh', 'Like', 'You are', 'Uh huh', 'UR', 'Next', 'What?', 'Sure'],
  Done: ['Sure', 'Uh huh', 'Next', 'What?', 'Your', 'UR', "You're", 'Hold', 'Like', 'You', 'U', 'You are', 'Uh uh', 'Done'],
  Next: ['What?', 'Uh huh', 'Uh uh', 'Your', 'Hold', 'Sure', 'Next', 'Like', 'Done', 'You are', 'UR', "You're", 'U', 'You'],
  Hold: ['You are', 'U', 'Done', 'Uh uh', 'You', 'UR', 'Sure', 'What?', "You're", 'Next', 'Hold', 'Uh huh', 'Your', 'Like'],
  Sure: ['You are', 'Done', 'Like', "You're", 'You', 'Hold', 'Uh huh', 'UR', 'Sure', 'U', 'What?', 'Next', 'Your', 'Uh uh'],
  Like: ["You're", 'Next', 'U', 'UR', 'Hold', 'Done', 'Uh uh', 'What?', 'Uh huh', 'You', 'Like', 'Sure', 'You are', 'Your'],
}

/**
 * How far into a list you ever actually have to memorize.
 *
 * Six of the fourteen words are on the module, so if the first nine entries all
 * missed, the six buttons would have to fit in the remaining five words — which
 * cannot happen. Nine is therefore a hard ceiling, not a heuristic.
 */
export const MAX_USEFUL_DEPTH = 9

/**
 * The list as you memorize it: truncated at nine entries, or at the label's own
 * word — whichever comes first. The label is always one of the six buttons, so
 * reaching it means you have found your answer.
 */
export function studyList(label: ButtonLabel): ButtonLabel[] {
  const full = WORD_LISTS[label]
  const selfIdx = full.indexOf(label)
  const cut = selfIdx >= 0 ? Math.min(selfIdx + 1, MAX_USEFUL_DEPTH) : MAX_USEFUL_DEPTH
  return full.slice(0, cut)
}

export function groupOf(label: ButtonLabel): readonly ButtonLabel[] {
  return (GROUP_1 as readonly ButtonLabel[]).includes(label) ? GROUP_1 : GROUP_2
}

// ---- solving ---------------------------------------------------------------

export type Module = {
  /** The word on the display. May be `BLANK_DISPLAY`. */
  display: string
  /** The six button labels, reading left to right, top to bottom. */
  buttons: ButtonLabel[]
}

/** Step 1: which button to read. 0-indexed. */
export function readPosition(display: string): number {
  const pos = POSITION_OF[display]
  if (pos === undefined) throw new Error(`Unknown display word: "${display}"`)
  return pos
}

/** Step 2: which button to press, given the label you read. 0-indexed. */
export function pressIndexFor(label: ButtonLabel, buttons: ButtonLabel[]): number {
  for (const word of WORD_LISTS[label]) {
    const idx = buttons.indexOf(word)
    if (idx >= 0) return idx
  }
  throw new Error(`No word from ${label}'s list is on the module`)
}

/** The whole module: which button to press. 0-indexed. */
export function solve(module: Module): number {
  const label = module.buttons[readPosition(module.display)]
  if (!label) throw new Error('Module has no button at the read position')
  return pressIndexFor(label, module.buttons)
}

// ---- generating ------------------------------------------------------------

/** Every display word, in no particular order. */
export const ALL_DISPLAY_WORDS: string[] = POSITIONS.flatMap((p) => DISPLAY_WORDS[p])

export function generate(rng: Rng): Module {
  const group = rng() < 0.5 ? GROUP_1 : GROUP_2
  return {
    display: randomItem(rng, ALL_DISPLAY_WORDS),
    buttons: shuffle(rng, group).slice(0, 6) as ButtonLabel[],
  }
}
