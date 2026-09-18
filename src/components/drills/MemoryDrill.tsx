import { useCallback, useState } from 'react'
import { mathRandom } from '../../lib/rng'
import {
  describe,
  generateStage,
  ruleFor,
  solve,
  TOTAL_STAGES,
  type Press,
  type Stage,
} from '../../lib/rules/memory'
import { DrillButton, DrillShell } from '../ui/DrillShell'
import { useHydrationSafe, type DrillStatus } from '../ui/useDrill'

/**
 * The one drill that does not use `useDrill`: a Memory round is five linked
 * stages with carried state, not a sequence of independent questions.
 *
 * What makes the module hard is holding stage 1-4's labels and stage 1-2's
 * positions in your head while the board reshuffles, so the history stays
 * hidden behind a toggle — showing it by default would drill looking things
 * up rather than remembering them.
 */
export default function MemoryDrill() {
  const [stage, setStage] = useState(1)
  // Hydration-safe: the server and the first client render must agree on the
  // board, so the initial stage is seeded and randomised after mount.
  const [current, setCurrent] = useHydrationSafe<Stage>(useCallback((rng) => generateStage(rng), []))
  const [history, setHistory] = useState<Press[]>([])
  const [status, setStatus] = useState<DrillStatus>('asking')
  const [stats, setStats] = useState({ correct: 0, strikes: 0 })
  const [showHistory, setShowHistory] = useState(false)

  const done = stage > TOTAL_STAGES

  const restart = () => {
    setStage(1)
    setCurrent(generateStage(mathRandom))
    setHistory([])
    setStatus('asking')
  }

  const reset = () => {
    setStats({ correct: 0, strikes: 0 })
    setShowHistory(false)
    restart()
  }

  const onPress = (position: number) => {
    if (done || status === 'right') return

    const expected = solve(stage, current, history)
    if (position !== expected) {
      setStats((s) => ({ ...s, strikes: s.strikes + 1 }))
      setStatus('wrong')
      return
    }

    const press: Press = { position: position as Press['position'], label: current.buttons[position - 1]! }
    const nextHistory = [...history, press]
    setHistory(nextHistory)
    setStatus('asking')

    if (stage === TOTAL_STAGES) {
      setStats((s) => ({ ...s, correct: s.correct + 1 }))
      setStage(stage + 1)
    } else {
      setStage(stage + 1)
      setCurrent(generateStage(mathRandom))
    }
  }

  return (
    <DrillShell
      prompt={done ? 'Module disarmed.' : `Stage ${stage} of ${TOTAL_STAGES}`}
      stats={stats}
      status={done ? 'right' : status}
      onReset={reset}
      footer="A strike in game resets the module to stage 1 — here it just lets you retry."
    >
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
        {/* Stage indicator, as the module shows it down the left side. */}
        <div className="flex gap-1" aria-label={`Stage ${Math.min(stage, TOTAL_STAGES)}`}>
          {Array.from({ length: TOTAL_STAGES }, (_, i) => (
            <span
              key={i}
              className="h-1.5 w-8 rounded-full"
              style={{
                background: i < history.length ? 'var(--color-good)' : 'var(--color-chassis-600)',
              }}
            />
          ))}
        </div>

        <div
          className="flex h-24 w-24 items-center justify-center rounded border-4 text-5xl font-bold"
          style={{ background: '#365d4d', borderColor: '#242e28', color: '#f0f4f7' }}
        >
          {done ? '✓' : current.display}
        </div>

        <div className="flex gap-2">
          {current.buttons.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPress(idx + 1)}
              disabled={done}
              className="h-14 w-12 rounded border-2 text-2xl font-bold disabled:opacity-50"
              style={{ background: '#b9a789', borderColor: '#3b2e1c', color: '#3b2e1c' }}
              aria-label={`Position ${idx + 1}, labelled ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {done ? (
            <DrillButton onClick={restart} primary>
              New module
            </DrillButton>
          ) : (
            <>
              <DrillButton onClick={() => setShowHistory((v) => !v)}>
                {showHistory ? 'Hide' : 'Show'} what I pressed
              </DrillButton>
              {status === 'wrong' && (
                <DrillButton onClick={restart}>Restart module</DrillButton>
              )}
            </>
          )}
        </div>

        {showHistory && history.length > 0 && (
          <table className="w-full text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <thead>
              <tr style={{ color: 'var(--text-faint)' }}>
                <th className="py-0.5 font-normal">Stage</th>
                <th className="py-0.5 font-normal">Position</th>
                <th className="py-0.5 font-normal">Label</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p, i) => (
                <tr key={i}>
                  <td className="py-0.5">{i + 1}</td>
                  <td className="py-0.5">{p.position}</td>
                  <td className="py-0.5">{p.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {status === 'wrong' && !done && (
          <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            Stage {stage}, display {current.display}: {describe(ruleFor(stage, current.display))}.
          </p>
        )}
      </div>
    </DrillShell>
  )
}
