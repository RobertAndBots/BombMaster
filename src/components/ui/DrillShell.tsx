import type { ReactNode } from 'react'
import type { DrillStats, DrillStatus } from './useDrill'

/**
 * The frame every drill sits in: a prompt, the tally, and a reset.
 *
 * One shell rather than per-module chrome, so a drill file is only ever the
 * module's own interaction — and so adding the four missing drills (bk-132)
 * means writing a board, not a page.
 */
export function DrillShell({
  prompt,
  stats,
  status,
  onReset,
  children,
  footer,
}: {
  prompt: ReactNode
  stats: DrillStats
  status: DrillStatus
  onReset: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section
      className="rounded-lg border p-4 sm:p-5 not-prose"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)' }}
      aria-label="Practice drill"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {prompt}
        </p>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
          <span>
            <span style={{ color: 'var(--color-good)' }}>{stats.correct}</span> correct
          </span>
          <span>
            <span style={{ color: 'var(--color-strike)' }}>{stats.strikes}</span> strikes
          </span>
          <button
            type="button"
            onClick={onReset}
            className="rounded border px-2 py-0.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Reset
          </button>
        </div>
      </div>

      {children}

      {/* One live region for the whole drill, so a screen reader announces the
          result once rather than re-reading the board on every render. */}
      <p
        role="status"
        aria-live="polite"
        className="mt-3 text-sm min-h-[1.25rem]"
        style={{
          color:
            status === 'right'
              ? 'var(--color-good)'
              : status === 'wrong'
                ? 'var(--color-strike)'
                : 'var(--text-faint)',
        }}
      >
        {status === 'right' ? 'Correct.' : status === 'wrong' ? 'Strike — try again.' : footer}
      </p>
    </section>
  )
}

/** A neutral action button, used for "Next", "Show me", and the like. */
export function DrillButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded border px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-40"
      style={{
        borderColor: primary ? 'var(--color-amber)' : 'var(--border-strong)',
        color: primary ? 'var(--color-amber)' : 'var(--text-muted)',
        background: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

/**
 * A row of mutually exclusive options — the drill's mode picker.
 *
 * A real <button> per option with aria-pressed, rather than the old site's
 * clickable <div>s, which could not be reached or operated from a keyboard.
 */
export function OptionBar<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap rounded border overflow-hidden"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="px-3 py-1.5 text-sm"
            style={{
              background: active ? 'var(--color-amber)' : 'transparent',
              color: active ? 'var(--color-chassis-950)' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
