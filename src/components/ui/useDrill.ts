import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { mathRandom, seeded, type Rng } from '../../lib/rng'

export type DrillStatus = 'asking' | 'wrong' | 'right'

export type DrillStats = {
  /** Questions answered correctly without missing first. */
  correct: number
  /** Wrong answers. Named "strikes" because that is what the game calls them. */
  strikes: number
}

/**
 * The server render and the first client render both use this seed, so the
 * HTML Astro ships matches what React produces on hydration. Calling
 * Math.random() in the initial state instead produces a different bomb on each
 * side and React throws a hydration mismatch — which is exactly what happened
 * the first time these drills were built.
 *
 * The effect below swaps in a genuinely random module immediately after mount,
 * so nobody ever sees seed 0 for longer than a frame.
 */
const HYDRATION_SEED = 0

export function useDrill<Q>(generate: (rng: Rng) => Q) {
  const [question, setQuestion] = useState<Q>(() => generate(seeded(HYDRATION_SEED)))
  const [stats, setStats] = useState<DrillStats>({ correct: 0, strikes: 0 })
  const [status, setStatus] = useState<DrillStatus>('asking')

  /**
   * Whether the current question has already been missed. A ref rather than
   * state because `solve()` needs to read it synchronously to decide whether
   * to count the answer — reading it from `status` inside a setState updater
   * meant mutating one piece of state from another's reducer, which React is
   * free to run twice.
   */
  const missed = useRef(false)

  /**
   * Regenerate whenever the generator itself changes.
   *
   * This is what makes a drill's mode picker work. Doing it in the click
   * handler instead does not: `setMode(m)` does not update the `generate`
   * closure until the next render, so the handler would regenerate using the
   * mode the user just navigated away from.
   */
  useEffect(() => {
    setQuestion(generate(mathRandom))
    setStatus('asking')
    missed.current = false
  }, [generate])

  const next = useCallback(() => {
    setQuestion(generate(mathRandom))
    setStatus('asking')
    missed.current = false
  }, [generate])

  /** Record a wrong answer. Stays on the same question so you can retry. */
  const strike = useCallback(() => {
    missed.current = true
    setStats((s) => ({ ...s, strikes: s.strikes + 1 }))
    setStatus('wrong')
  }, [])

  /**
   * Record a right answer. Only counts toward `correct` if this question had
   * not already been missed — otherwise the tally would reward guessing until
   * something sticks.
   */
  const solve = useCallback(() => {
    if (!missed.current) setStats((s) => ({ ...s, correct: s.correct + 1 }))
    setStatus('right')
  }, [])

  const reset = useCallback(() => {
    setStats({ correct: 0, strikes: 0 })
    setQuestion(generate(mathRandom))
    setStatus('asking')
    missed.current = false
  }, [generate])

  /** The common shape: check an answer, then advance or strike. */
  const check = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) solve()
      else strike()
      return isCorrect
    },
    [solve, strike],
  )

  return { question, setQuestion, stats, status, setStatus, next, strike, solve, check, reset }
}

/**
 * The same hydration-safe initial value, for a drill that manages its own
 * state rather than using `useDrill` (Memory, Mazes).
 */
export function useHydrationSafe<T>(
  generate: (rng: Rng) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => generate(seeded(HYDRATION_SEED)))
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    setValue(generate(mathRandom))
  }, [generate])

  return [value, setValue]
}
