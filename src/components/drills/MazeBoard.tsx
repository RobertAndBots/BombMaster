import { GRID_SIZE, type Maze, type Point, type Wall } from '../../lib/rules/mazes'

/**
 * The maze as SVG rather than the old site's canvas.
 *
 * Canvas meant imperative redraws, a fixed pixel size and nothing for a screen
 * reader. SVG scales to any phone width, and the whole board can carry a
 * single text description of where you are.
 */

const CELL = 44
const PAD = 8
const SIZE = GRID_SIZE * CELL + PAD * 2

export function MazeBoard({
  maze,
  position,
  goal,
  showWalls,
  bumpedWall,
  onMove,
}: {
  maze: Maze
  position: Point
  goal: Point | null
  showWalls: boolean
  /** Briefly drawn when you walk into it, which is how you learn the layout. */
  bumpedWall?: Wall | null
  onMove?: (dir: 'up' | 'down' | 'left' | 'right') => void
}) {
  const cx = (x: number) => PAD + x * CELL + CELL / 2
  const cy = (y: number) => PAD + y * CELL + CELL / 2
  const gx = (x: number) => PAD + x * CELL
  const gy = (y: number) => PAD + y * CELL

  const description = goal
    ? `You are at column ${position.x + 1}, row ${position.y + 1}. The target is at column ${goal.x + 1}, row ${goal.y + 1}.`
    : `You are at column ${position.x + 1}, row ${position.y + 1}.`

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[320px] touch-manipulation"
        role="img"
        aria-label={description}
      >
        <rect
          x={PAD}
          y={PAD}
          width={GRID_SIZE * CELL}
          height={GRID_SIZE * CELL}
          fill="var(--bg-elev-2)"
          stroke="var(--border-strong)"
          strokeWidth={2}
        />

        {/* Cell grid, faint — the module shows these dots. */}
        {Array.from({ length: GRID_SIZE }, (_, x) =>
          Array.from({ length: GRID_SIZE }, (_, y) => (
            <circle key={`${x}-${y}`} cx={cx(x)} cy={cy(y)} r={1.5} fill="var(--text-faint)" />
          )),
        )}

        {showWalls &&
          maze.walls.map(([a, b], i) => (
            <line
              key={i}
              x1={gx(a.x)}
              y1={gy(a.y)}
              x2={gx(b.x)}
              y2={gy(b.y)}
              stroke="var(--text-muted)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}

        {bumpedWall && (
          <line
            x1={gx(bumpedWall[0].x)}
            y1={gy(bumpedWall[0].y)}
            x2={gx(bumpedWall[1].x)}
            y2={gy(bumpedWall[1].y)}
            stroke="var(--color-strike)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}

        {/* The two circles that identify which maze this is. */}
        {maze.circles.map((c, i) => (
          <circle
            key={i}
            cx={cx(c.x)}
            cy={cy(c.y)}
            r={9}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={2.5}
          />
        ))}

        {goal && (
          <polygon
            points={`${cx(goal.x)},${cy(goal.y) - 9} ${cx(goal.x) + 9},${cy(goal.y) + 7} ${cx(goal.x) - 9},${cy(goal.y) + 7}`}
            fill="var(--color-strike)"
          />
        )}

        <circle cx={cx(position.x)} cy={cy(position.y)} r={7} fill="var(--color-wire-white)" />
      </svg>

      {onMove && (
        <div className="grid grid-cols-3 gap-1" role="group" aria-label="Move">
          <span />
          <ArrowButton label="Move up" onClick={() => onMove('up')}>
            &#9650;
          </ArrowButton>
          <span />
          <ArrowButton label="Move left" onClick={() => onMove('left')}>
            &#9664;
          </ArrowButton>
          <ArrowButton label="Move down" onClick={() => onMove('down')}>
            &#9660;
          </ArrowButton>
          <ArrowButton label="Move right" onClick={() => onMove('right')}>
            &#9654;
          </ArrowButton>
        </div>
      )}
    </div>
  )
}

function ArrowButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-10 w-12 rounded border text-sm"
      style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
    >
      {children}
    </button>
  )
}
