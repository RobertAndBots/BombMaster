import { useCallback, useEffect, useRef, useState } from 'react'
import { mathRandom } from '../../lib/rng'
import {
  equal,
  generate,
  MAZES,
  move,
  type Direction,
  type MazeRound,
  type Wall,
} from '../../lib/rules/mazes'
import { DrillButton, DrillShell, OptionBar } from '../ui/DrillShell'
import { useHydrationSafe } from '../ui/useDrill'
import { MazeBoard } from './MazeBoard'

type Mode = 'study' | 'drill'

/**
 * One component, two jobs.
 *
 * `study` lets you pick a maze and walk it with the walls hidden, revealing
 * them on demand — that is how you learn a layout. `drill` gives you a random
 * maze and a target and counts the walls you hit. They differ only in whether
 * you choose the maze and whether peeking is free, so splitting them into two
 * components would duplicate all the movement handling.
 */
export default function MazeTrainer({ mode = 'drill' }: { mode?: Mode }) {
  const [mazeIndex, setMazeIndex] = useState(0)
  // Hydration-safe: seeded for the server and first client render, randomised
  // after mount. Generating here with Math.random() gives the two renders
  // different mazes and React throws a mismatch.
  const [round, setRound] = useHydrationSafe<MazeRound>(
    useCallback((rng) => (mode === 'study' ? generate(rng, 0, true) : generate(rng)), [mode]),
  )
  const [showWalls, setShowWalls] = useState(false)
  const [bumped, setBumped] = useState<Wall | null>(null)
  const [stats, setStats] = useState({ correct: 0, strikes: 0 })
  const [solved, setSolved] = useState(false)

  const maze = MAZES[round.mazeIndex]!
  const boardRef = useRef<HTMLDivElement>(null)

  const nextRound = useCallback(
    (idx?: number) => {
      const target = idx ?? (mode === 'study' ? mazeIndex : undefined)
      setRound(generate(mathRandom, target, mode === 'study'))
      setSolved(false)
      setBumped(null)
    },
    [mazeIndex, mode],
  )

  const step = useCallback(
    (dir: Direction) => {
      if (solved) return
      const result = move(maze, round.position, dir)

      if (result.kind === 'blocked') {
        setBumped(result.wall)
        setStats((s) => ({ ...s, strikes: s.strikes + 1 }))
        return
      }
      if (result.kind === 'edge') return

      setBumped(null)
      const position = result.position
      setRound((r) => ({ ...r, position }))

      if (equal(position, round.goal)) {
        setStats((s) => ({ ...s, correct: s.correct + 1 }))
        setSolved(true)
      }
    },
    [maze, round.position, round.goal, solved],
  )

  // Arrow keys and WASD, but only once the board has focus — otherwise a maze
  // halfway down a study page would swallow the reader's arrow-key scrolling.
  useEffect(() => {
    const el = boardRef.current
    if (!el) return

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        arrowup: 'up',
        arrowdown: 'down',
        arrowleft: 'left',
        arrowright: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }
      const key = e.key.toLowerCase()
      if (key === ' ' && mode === 'study') {
        e.preventDefault()
        setShowWalls((v) => !v)
        return
      }
      const dir = map[key]
      if (!dir) return
      e.preventDefault()
      step(dir)
    }

    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [step, mode])

  // Clear the bumped wall after a beat so it reads as a flash, not a reveal.
  useEffect(() => {
    if (!bumped) return
    const t = setTimeout(() => setBumped(null), 600)
    return () => clearTimeout(t)
  }, [bumped])

  return (
    <DrillShell
      prompt={solved ? 'Reached it.' : 'Navigate to the red triangle.'}
      stats={stats}
      status={solved ? 'right' : bumped ? 'wrong' : 'asking'}
      onReset={() => {
        setStats({ correct: 0, strikes: 0 })
        setShowWalls(false)
        nextRound()
      }}
      footer="Click the board, then use the arrow keys or WASD. Space toggles walls."
    >
      <div className="flex flex-col items-center gap-3">
        {mode === 'study' && (
          <OptionBar
            label="Which maze"
            value={mazeIndex}
            onChange={(idx) => {
              setMazeIndex(idx)
              nextRound(idx)
            }}
            options={MAZES.map((_, i) => ({ value: i, label: String(i + 1) }))}
          />
        )}

        <div
          ref={boardRef}
          tabIndex={0}
          className="rounded outline-none"
          aria-label="Maze board. Use arrow keys to move."
        >
          <MazeBoard
            maze={maze}
            position={round.position}
            goal={round.goal}
            showWalls={showWalls}
            bumpedWall={bumped}
            onMove={step}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <DrillButton onClick={() => setShowWalls((v) => !v)}>
            {showWalls ? 'Hide walls' : 'Show walls'}
          </DrillButton>
          <DrillButton onClick={() => nextRound()} primary={solved}>
            {mode === 'study' ? 'New target' : 'New maze'}
          </DrillButton>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Maze {round.mazeIndex + 1} of {MAZES.length} — identified by the two circles.
        </p>
      </div>
    </DrillShell>
  )
}
