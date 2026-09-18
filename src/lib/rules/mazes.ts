/**
 * Maze navigation — the movement rules for the layouts in `maze-data.ts`.
 *
 * Ported from `src/maze/{maze,mazeUtil,directions}.js`. Kept separate from the
 * data so the drill, the study navigator and any future solver share one
 * definition of "can I move from here to there".
 */
import { rnd, type Rng } from '../rng'
import { GRID_SIZE, MAZES, type Maze, type Point, type Wall } from './maze-data'

export { GRID_SIZE, MAZES, type Maze, type Point, type Wall }

export const DIRECTIONS = ['up', 'down', 'left', 'right'] as const
export type Direction = (typeof DIRECTIONS)[number]

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function equal(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function contains(points: Point[], p: Point): boolean {
  return points.some((q) => equal(q, p))
}

function inBounds(p: Point): boolean {
  return p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE
}

/**
 * Do segments AB and CD cross?
 *
 * Movement is tested by drawing a line between the two cell CENTRES and asking
 * whether it crosses any wall. That is why the endpoints are offset by 0.5 in
 * `canMove` — a centre-to-centre line crosses a wall segment strictly in its
 * interior, so the strict inequalities below are correct and a wall that only
 * touches the path at an endpoint does not block it.
 */
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y)
  if (det === 0) return false
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det
  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1
}

/** The wall segment that sits between two adjacent cells. */
export function wallBetween(from: Point, to: Point): Wall | null {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dy === -1) return [{ x: from.x, y: from.y }, { x: from.x + 1, y: from.y }]
  if (dy === 1) return [{ x: from.x, y: from.y + 1 }, { x: from.x + 1, y: from.y + 1 }]
  if (dx === -1) return [{ x: from.x, y: from.y }, { x: from.x, y: from.y + 1 }]
  if (dx === 1) return [{ x: from.x + 1, y: from.y }, { x: from.x + 1, y: from.y + 1 }]
  return null
}

/** Can you walk from `from` to the adjacent cell `to` in this maze? */
export function canMove(maze: Maze, from: Point, to: Point): boolean {
  if (!inBounds(to)) return false
  const a = { x: from.x + 0.5, y: from.y + 0.5 }
  const b = { x: to.x + 0.5, y: to.y + 0.5 }
  return !maze.walls.some(([c, d]) => intersects(a, b, c, d))
}

export type MoveResult =
  /** Moved. */
  | { kind: 'moved'; position: Point }
  /** Blocked by a wall — the drill flashes it so you learn the layout. */
  | { kind: 'blocked'; wall: Wall }
  /** Walked off the edge of the grid. */
  | { kind: 'edge' }

export function move(maze: Maze, from: Point, dir: Direction): MoveResult {
  const delta = DELTA[dir]
  const to = { x: from.x + delta.x, y: from.y + delta.y }

  if (!inBounds(to)) return { kind: 'edge' }
  if (!canMove(maze, from, to)) {
    const wall = wallBetween(from, to)
    return wall ? { kind: 'blocked', wall } : { kind: 'edge' }
  }
  return { kind: 'moved', position: to }
}

/** Identify a maze from the two circle markers, in any order. */
export function findMazeByCircles(circles: Point[]): number {
  return MAZES.findIndex(
    (m) => m.circles.length === circles.length && circles.every((c) => contains(m.circles, c)),
  )
}

// ---- pathfinding -----------------------------------------------------------

/** Shortest path from `start` to `goal` inclusive, or null if unreachable. */
export function shortestPath(maze: Maze, start: Point, goal: Point): Point[] | null {
  const key = (p: Point) => `${p.x},${p.y}`
  const prev = new Map<string, Point | null>([[key(start), null]])
  const queue: Point[] = [start]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (equal(current, goal)) {
      const path: Point[] = []
      let node: Point | null | undefined = current
      while (node) {
        path.unshift(node)
        node = prev.get(key(node))
      }
      return path
    }
    for (const dir of DIRECTIONS) {
      const delta = DELTA[dir]
      const next = { x: current.x + delta.x, y: current.y + delta.y }
      if (!inBounds(next) || prev.has(key(next))) continue
      if (!canMove(maze, current, next)) continue
      prev.set(key(next), current)
      queue.push(next)
    }
  }

  return null
}

// ---- generating ------------------------------------------------------------

export type MazeRound = {
  mazeIndex: number
  position: Point
  goal: Point
}

export function randomPoint(rng: Rng): Point {
  return { x: rnd(rng, GRID_SIZE), y: rnd(rng, GRID_SIZE) }
}

/**
 * Set up a round.
 *
 * `anywhere` targets any square rather than one of the maze's listed goals —
 * useful for drilling a layout exhaustively rather than only the positions the
 * game happens to use.
 */
export function generate(rng: Rng, mazeIndex?: number, anywhere = false): MazeRound {
  const idx = mazeIndex ?? rnd(rng, MAZES.length)
  const maze = MAZES[idx]
  if (!maze) throw new Error(`No maze ${idx}`)

  const position = randomPoint(rng)
  const pickGoal = () =>
    anywhere ? randomPoint(rng) : maze.goals[rnd(rng, maze.goals.length)]!

  let goal = pickGoal()
  while (equal(goal, position)) goal = pickGoal()

  return { mazeIndex: idx, position, goal }
}
