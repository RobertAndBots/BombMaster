import { useCallback, useState } from 'react'
import type { Rng } from '../../lib/rng'
import {
  COLOR_NAMES,
  generate,
  generateForCondition,
  solvePosition,
  type WireColor,
  type WireConfig,
} from '../../lib/rules/simple-wires'
import { DrillButton, DrillShell, OptionBar } from '../ui/DrillShell'
import { useDrill } from '../ui/useDrill'

const WIRE_STYLE: Record<WireColor, { background: string; color: string }> = {
  B: { background: 'var(--color-wire-black)', color: '#e9eaee' },
  U: { background: 'var(--color-wire-blue)', color: '#ffffff' },
  R: { background: 'var(--color-wire-red)', color: '#ffffff' },
  W: { background: 'var(--color-wire-white)', color: '#17181c' },
  Y: { background: 'var(--color-wire-yellow)', color: '#17181c' },
}

type Mode = 0 | 3 | 4 | 5 | 6

export default function SimpleWiresDrill() {
  const [mode, setMode] = useState<Mode>(0)

  // Re-created when the mode changes so `useDrill` regenerates against the
  // right wire count.
  const gen = useCallback(
    (rng: Rng) => (mode === 0 ? generate(rng) : generate(rng, mode)),
    [mode],
  )

  const { question, stats, status, next, check, reset } = useDrill<WireConfig>(gen)
  const answer = solvePosition(question)

  const onCut = (position: number) => {
    if (status === 'right') return
    if (check(position === answer)) setTimeout(next, 650)
  }

  return (
    <DrillShell
      prompt="Which wire do you cut?"
      stats={stats}
      status={status}
      onReset={reset}
      footer="Click a wire to cut it."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <OptionBar
          label="Number of wires"
          value={mode}
          onChange={(m) => {
            setMode(m)
            reset()
          }}
          options={[
            { value: 0 as Mode, label: 'Any' },
            { value: 3 as Mode, label: '3' },
            { value: 4 as Mode, label: '4' },
            { value: 5 as Mode, label: '5' },
            { value: 6 as Mode, label: '6' },
          ]}
        />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Serial number is{' '}
          <strong style={{ color: 'var(--color-amber)' }}>
            {question.odd ? 'odd' : 'even'}
          </strong>
        </span>
      </div>

      <ol className="mx-auto max-w-sm space-y-1.5">
        {question.wires.map((wire, idx) => {
          const position = idx + 1
          const isAnswer = position === answer
          const revealed = status === 'right' && isAnswer
          return (
            <li key={idx} className="flex items-center gap-2">
              <span
                className="w-4 text-right text-xs tabular-nums"
                style={{ color: 'var(--text-faint)' }}
              >
                {position}
              </span>
              <button
                type="button"
                onClick={() => onCut(position)}
                className="flex-1 rounded-sm border px-2 py-2 text-left text-xs font-semibold tracking-wide transition-transform"
                style={{
                  ...WIRE_STYLE[wire],
                  borderColor: revealed ? 'var(--color-good)' : 'var(--border-strong)',
                  boxShadow: revealed ? '0 0 0 2px var(--color-good)' : undefined,
                }}
                aria-label={`Cut wire ${position}, ${COLOR_NAMES[wire]}`}
              >
                {COLOR_NAMES[wire]}
              </button>
            </li>
          )
        })}
      </ol>

      {status !== 'asking' && (
        <div className="mt-4 flex justify-center gap-2">
          <DrillButton onClick={next} primary>
            Next module
          </DrillButton>
        </div>
      )}
    </DrillShell>
  )
}
