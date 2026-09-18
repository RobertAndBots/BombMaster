/**
 * Memory — manual p11.
 *
 * Ported from `src/components/memory/practice.jsx:getExpected()`, which held
 * the entire five-stage ruleset inside a React component method.
 *
 * The module is a five-stage sequence: each stage shows a big display digit
 * and four buttons carrying the labels 1-4 in some order, and the rule for a
 * stage can refer back to what you pressed in an earlier one. Two different
 * kinds of back-reference, and confusing them is the classic way to strike:
 *
 * - **position** — "the button in the same position as stage 2"
 * - **label** — "the button with the same label as stage 2", which will
 *   usually be in a different position this time round
 */

export type Digit = 1 | 2 | 3 | 4

/** The four button labels, read left to right. A permutation of 1-4. */
export type Buttons = [Digit, Digit, Digit, Digit]

export type Stage = {
  display: Digit
  buttons: Buttons
}

/** What you pressed at a stage: where it was, and what it said. */
export type Press = {
  position: Digit
  label: Digit
}

/** A rule's instruction, in the manual's own vocabulary. */
export type Instruction =
  | { kind: 'position'; position: Digit }
  | { kind: 'label'; label: Digit }
  | { kind: 'stagePosition'; stage: number }
  | { kind: 'stageLabel'; stage: number }

/**
 * The manual's table, verbatim: `RULES[stage][display]`.
 *
 * Kept as data rather than a chain of ifs because it is also what the study
 * page renders — one table, so the prose and the drill cannot drift apart.
 */
export const RULES: Record<number, Record<Digit, Instruction>> = {
  1: {
    1: { kind: 'position', position: 2 },
    2: { kind: 'position', position: 2 },
    3: { kind: 'position', position: 3 },
    4: { kind: 'position', position: 4 },
  },
  2: {
    1: { kind: 'label', label: 4 },
    2: { kind: 'stagePosition', stage: 1 },
    3: { kind: 'position', position: 1 },
    4: { kind: 'stagePosition', stage: 1 },
  },
  3: {
    1: { kind: 'stageLabel', stage: 2 },
    2: { kind: 'stageLabel', stage: 1 },
    3: { kind: 'position', position: 3 },
    4: { kind: 'label', label: 4 },
  },
  4: {
    1: { kind: 'stagePosition', stage: 1 },
    2: { kind: 'position', position: 1 },
    3: { kind: 'stagePosition', stage: 2 },
    4: { kind: 'stagePosition', stage: 2 },
  },
  5: {
    1: { kind: 'stageLabel', stage: 1 },
    2: { kind: 'stageLabel', stage: 2 },
    3: { kind: 'stageLabel', stage: 4 },
    4: { kind: 'stageLabel', stage: 3 },
  },
}

export const TOTAL_STAGES = 5

/** Where the button carrying `label` currently sits. 1-indexed. */
export function positionOfLabel(buttons: Buttons, label: Digit): Digit {
  const idx = buttons.indexOf(label)
  if (idx < 0) throw new Error(`No button labelled ${label}`)
  return (idx + 1) as Digit
}

/**
 * Which position to press, 1-indexed.
 *
 * `history` is the presses so far, oldest first — so `history[0]` is stage 1.
 */
export function solve(stage: number, current: Stage, history: Press[]): Digit {
  const rule = RULES[stage]?.[current.display]
  if (!rule) throw new Error(`No rule for stage ${stage}, display ${current.display}`)

  switch (rule.kind) {
    case 'position':
      return rule.position
    case 'label':
      return positionOfLabel(current.buttons, rule.label)
    case 'stagePosition': {
      const past = history[rule.stage - 1]
      if (!past) throw new Error(`Stage ${rule.stage} has not happened yet`)
      return past.position
    }
    case 'stageLabel': {
      const past = history[rule.stage - 1]
      if (!past) throw new Error(`Stage ${rule.stage} has not happened yet`)
      return positionOfLabel(current.buttons, past.label)
    }
  }
}

/** The instruction for a stage, for rendering "why" after an answer. */
export function ruleFor(stage: number, display: Digit): Instruction {
  const rule = RULES[stage]?.[display]
  if (!rule) throw new Error(`No rule for stage ${stage}, display ${display}`)
  return rule
}

/** Human-readable form of a rule, matching how the manual phrases it. */
export function describe(rule: Instruction): string {
  switch (rule.kind) {
    case 'position':
      return `press the button in position ${rule.position}`
    case 'label':
      return `press the button labelled "${rule.label}"`
    case 'stagePosition':
      return `press the button in the same position as stage ${rule.stage}`
    case 'stageLabel':
      return `press the button with the same label as stage ${rule.stage}`
  }
}

import { rnd, shuffle, type Rng } from '../rng'

export function randomDisplay(rng: Rng): Digit {
  return rnd(rng, 1, 5) as Digit
}

export function randomButtons(rng: Rng): Buttons {
  return shuffle(rng, [1, 2, 3, 4] as Digit[]) as Buttons
}

export function generateStage(rng: Rng): Stage {
  return { display: randomDisplay(rng), buttons: randomButtons(rng) }
}
