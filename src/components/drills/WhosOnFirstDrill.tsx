import { useCallback, useState } from 'react'
import type { Rng } from '../../lib/rng'
import {
  BLANK_DISPLAY,
  generate,
  POSITIONS,
  pressIndexFor,
  readPosition,
  solve,
  type Module,
} from '../../lib/rules/whos-on-first'
import { DrillButton, DrillShell, OptionBar } from '../ui/DrillShell'
import { useDrill } from '../ui/useDrill'

type Step = 'both' | '1' | '2'

/**
 * Three modes, because the two steps fail for different reasons and are worth
 * drilling apart: step 1 is a lookup of 28 near-identical words, step 2 is 28
 * memorized priority lists.
 */
export default function WhosOnFirstDrill() {
  const [step, setStep] = useState<Step>('both')
  const gen = useCallback((rng: Rng) => generate(rng), [])
  const { question, stats, status, next, check, reset } = useDrill<Module>(gen)

  // In "both" mode you must first name the position, then press the button.
  const [namedPosition, setNamedPosition] = useState(false)

  const readIdx = readPosition(question.display)
  const label = question.buttons[readIdx]!
  const answerIdx = solve(question)

  const advance = () => {
    setNamedPosition(false)
    next()
  }

  const onPickPosition = (idx: number) => {
    if (status === 'right') return
    if (!check(idx === readIdx)) return
    if (step === '1') setTimeout(advance, 650)
    else setNamedPosition(true)
  }

  const onPressButton = (idx: number) => {
    if (status === 'right') return
    const target = step === '2' ? pressIndexFor(label, question.buttons) : answerIdx
    if (check(idx === target)) setTimeout(advance, 650)
  }

  const askingPosition = step === '1' || (step === 'both' && !namedPosition)

  return (
    <DrillShell
      prompt={askingPosition ? 'Which button do you read?' : 'Which button do you press?'}
      stats={stats}
      status={status}
      onReset={() => {
        setNamedPosition(false)
        reset()
      }}
      footer={
        step === '2'
          ? 'Step 2 only — the label to read is given.'
          : 'The display tells you which button to read, not which to press.'
      }
    >
      <div className="mb-4 flex justify-center">
        <OptionBar
          label="Which step to practice"
          value={step}
          onChange={(s) => {
            setStep(s)
            setNamedPosition(false)
            reset()
          }}
          options={[
            { value: 'both' as Step, label: 'Both steps' },
            { value: '1' as Step, label: 'Step 1' },
            { value: '2' as Step, label: 'Step 2' },
          ]}
        />
      </div>

      <div className="mx-auto max-w-xs">
        {/* The module itself: a display over six buttons. */}
        <div className="rounded p-2" style={{ background: 'var(--color-chassis-700)' }}>
          <div
            className="flex h-10 items-center justify-center rounded-sm border-2 text-sm font-semibold tracking-wide"
            style={{
              background: '#3d4f57',
              borderColor: '#10151b',
              color: '#ffffff',
            }}
          >
            {step === '2'
              ? label
              : question.display === BLANK_DISPLAY
                ? ' '
                : question.display}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {question.buttons.map((button, idx) => {
              const isTarget =
                status === 'right' && (askingPosition ? idx === readIdx : idx === answerIdx)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => (askingPosition ? onPickPosition(idx) : onPressButton(idx))}
                  className="flex h-10 items-center justify-center rounded-sm px-1 text-xs font-bold"
                  style={{
                    background: isTarget ? 'var(--color-good)' : '#cfbc9e',
                    color: '#2b2418',
                  }}
                  aria-label={`${POSITIONS[idx]}: ${button}`}
                >
                  {button}
                </button>
              )
            })}
          </div>
        </div>

        {step === '2' && (
          <p className="mt-2 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            Label from step 1: <strong style={{ color: 'var(--color-amber)' }}>{label}</strong>
          </p>
        )}
        {step === 'both' && namedPosition && status !== 'right' && (
          <p className="mt-2 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            You read <strong style={{ color: 'var(--color-amber)' }}>{label}</strong> — now press.
          </p>
        )}
      </div>

      {status !== 'asking' && (
        <div className="mt-4 flex justify-center">
          <DrillButton onClick={advance} primary>
            Next module
          </DrillButton>
        </div>
      )}
    </DrillShell>
  )
}
