import { useCallback, useState } from 'react'
import type { Rng } from '../../lib/rng'
import {
  generate,
  solve,
  SYMBOL_NAMES,
  type KeypadModule,
  type SymbolId,
} from '../../lib/rules/keypads'
import { DrillButton, DrillShell } from '../ui/DrillShell'
import { useDrill } from '../ui/useDrill'

export function SymbolImage({ id, size = 56 }: { id: SymbolId; size?: number }) {
  return (
    <img
      src={`/symbols/${id}.png`}
      alt={SYMBOL_NAMES[id] ?? id}
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size, imageRendering: 'auto' }}
    />
  )
}

export default function KeypadsDrill() {
  const gen = useCallback((rng: Rng) => generate(rng), [])
  const { question, stats, status, next, check, reset } = useDrill<KeypadModule>(gen)
  const [pressed, setPressed] = useState<SymbolId[]>([])

  const order = solve(question.symbols)

  const advance = () => {
    setPressed([])
    next()
  }

  const onPress = (symbol: SymbolId) => {
    if (status === 'right' || pressed.includes(symbol)) return

    if (symbol !== order[pressed.length]) {
      check(false)
      return
    }

    const nextPressed = [...pressed, symbol]
    setPressed(nextPressed)
    if (nextPressed.length === order.length) {
      check(true)
      setTimeout(advance, 700)
    }
  }

  return (
    <DrillShell
      prompt="Press the symbols in column order."
      stats={stats}
      status={status}
      onReset={() => {
        setPressed([])
        reset()
      }}
      footer={`${pressed.length} of ${order.length} pressed.`}
    >
      <div className="flex flex-wrap justify-center gap-3">
        {question.symbols.map((symbol) => {
          const idx = pressed.indexOf(symbol)
          const done = idx >= 0
          return (
            <button
              key={symbol}
              type="button"
              onClick={() => onPress(symbol)}
              className="relative rounded border p-2 transition-opacity"
              style={{
                borderColor: done ? 'var(--color-good)' : 'var(--border-strong)',
                background: 'var(--bg-elev-2)',
                opacity: done ? 0.55 : 1,
              }}
              aria-label={`${SYMBOL_NAMES[symbol] ?? symbol}${done ? `, pressed ${idx + 1}` : ''}`}
            >
              <SymbolImage id={symbol} />
              {done && (
                <span
                  className="absolute right-1 top-1 rounded-full px-1.5 text-xs font-bold"
                  style={{ background: 'var(--color-good)', color: 'var(--color-chassis-950)' }}
                >
                  {idx + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {status !== 'asking' && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {status === 'wrong' && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Column {question.setIndex + 1}.
            </p>
          )}
          <DrillButton onClick={advance} primary>
            Next module
          </DrillButton>
        </div>
      )}
    </DrillShell>
  )
}
