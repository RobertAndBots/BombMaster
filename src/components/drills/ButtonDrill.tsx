import { useCallback, useState } from 'react'
import { mathRandom, randomItem, type Rng } from '../../lib/rng'
import {
  BUTTON_COLOR_NAMES,
  generate,
  releaseDigit,
  solve,
  STRIP_COLORS,
  type ButtonColor,
  type ButtonConfig,
  type StripColor,
} from '../../lib/rules/button'
import { DrillButton, DrillShell } from '../ui/DrillShell'
import { useDrill } from '../ui/useDrill'

const FACE: Record<ButtonColor, { background: string; color: string }> = {
  B: { background: '#16171a', color: '#e9eaee' },
  U: { background: 'var(--color-wire-blue)', color: '#ffffff' },
  R: { background: 'var(--color-wire-red)', color: '#ffffff' },
  W: { background: 'var(--color-wire-white)', color: '#17181c' },
  Y: { background: 'var(--color-wire-yellow)', color: '#17181c' },
}

const STRIP_STYLE: Record<StripColor, string> = {
  Blue: 'var(--color-wire-blue)',
  Red: 'var(--color-wire-red)',
  White: 'var(--color-wire-white)',
  Yellow: 'var(--color-wire-yellow)',
}

/**
 * Two phases. First decide hold vs. tap; if you hold, a strip lights and you
 * pick the release digit.
 *
 * The batteries and indicators start hidden behind a reveal, which is the
 * point: in game those live on other faces of the bomb, so you have to know
 * that you need them before you ask. A drill that showed everything up front
 * would train the wrong habit.
 */
export default function ButtonDrill() {
  const gen = useCallback((rng: Rng) => generate(rng), [])
  const { question, stats, status, next, check, reset } = useDrill<ButtonConfig>(gen)

  const [showBatteries, setShowBatteries] = useState(false)
  const [showIndicators, setShowIndicators] = useState(false)
  const [strip, setStrip] = useState<StripColor | null>(null)

  const expected = solve(question)

  const advance = () => {
    setShowBatteries(false)
    setShowIndicators(false)
    setStrip(null)
    next()
  }

  const onAction = (action: 'hold' | 'tap') => {
    if (status === 'right') return
    if (!check(action === expected)) return
    if (action === 'tap') setTimeout(advance, 650)
    else setStrip(randomItem(mathRandom, STRIP_COLORS))
  }

  const onRelease = (digit: number) => {
    if (!strip) return
    if (digit === releaseDigit(strip)) setTimeout(advance, 650)
    else check(false)
  }

  // Once a strip is lit the hold was already correct, so the remaining
  // question is only where to release.
  const holding = strip !== null && status !== 'wrong'

  return (
    <DrillShell
      prompt={holding ? 'When do you release?' : 'Hold, or press and release?'}
      stats={stats}
      status={status}
      onReset={() => {
        setStrip(null)
        setShowBatteries(false)
        setShowIndicators(false)
        reset()
      }}
      footer="Reveal the bomb only when the rule you are on actually needs it."
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full border-2 text-sm font-bold"
          style={{ ...FACE[question.color], borderColor: 'var(--border-strong)' }}
        >
          {question.label}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {BUTTON_COLOR_NAMES[question.color]} button
        </p>

        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <RevealChip
            open={showBatteries}
            onOpen={() => setShowBatteries(true)}
            closed="Batteries?"
          >
            {question.batteries} {question.batteries === 1 ? 'battery' : 'batteries'}
          </RevealChip>
          <RevealChip
            open={showIndicators}
            onOpen={() => setShowIndicators(true)}
            closed="Indicators?"
          >
            {question.indicators.length > 0 ? question.indicators.join(', ') : 'none lit'}
          </RevealChip>
        </div>

        {!holding ? (
          <div className="flex gap-2">
            <DrillButton onClick={() => onAction('hold')}>Hold</DrillButton>
            <DrillButton onClick={() => onAction('tap')}>Press &amp; release</DrillButton>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="rounded border px-8 py-1.5 text-xs font-bold"
              style={{
                background: STRIP_STYLE[strip!],
                color: strip === 'Blue' || strip === 'Red' ? '#fff' : '#17181c',
                borderColor: 'var(--border-strong)',
              }}
            >
              {strip} strip
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <DrillButton key={d} onClick={() => onRelease(d)}>
                  {d}
                </DrillButton>
              ))}
            </div>
          </div>
        )}

        {status !== 'asking' && (
          <DrillButton onClick={advance} primary>
            Next module
          </DrillButton>
        )}
      </div>
    </DrillShell>
  )
}

function RevealChip({
  open,
  onOpen,
  closed,
  children,
}: {
  open: boolean
  onOpen: () => void
  closed: string
  children: React.ReactNode
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="rounded-full border px-3 py-1 text-xs"
        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-faint)' }}
      >
        {closed}
      </button>
    )
  }
  return (
    <span
      className="rounded-full border px-3 py-1 text-xs"
      style={{ borderColor: 'var(--color-amber)', color: 'var(--color-amber)' }}
    >
      {children}
    </span>
  )
}
