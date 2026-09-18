import { describe, expect, it } from 'vitest'
import { seeded } from '../rng'
import {
  canMove,
  contains,
  DIRECTIONS,
  equal,
  findMazeByCircles,
  generate,
  GRID_SIZE,
  MAZES,
  move,
  shortestPath,
  type Point,
} from './mazes'

const allCells = (): Point[] => {
  const cells: Point[] = []
  for (let x = 0; x < GRID_SIZE; x++) for (let y = 0; y < GRID_SIZE; y++) cells.push({ x, y })
  return cells
}

describe('data integrity', () => {
  it('has nine mazes', () => {
    expect(MAZES).toHaveLength(9)
  })

  it('each maze has exactly two identifying circles', () => {
    for (const maze of MAZES) expect(maze.circles).toHaveLength(2)
  })

  it('every point is inside the 6x6 grid', () => {
    for (const maze of MAZES) {
      for (const p of [...maze.circles, ...maze.goals]) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThan(GRID_SIZE)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThan(GRID_SIZE)
      }
    }
  })

  it('every wall runs along a grid line and spans at least one cell', () => {
    for (const maze of MAZES) {
      for (const [a, b] of maze.walls) {
        expect(a.x === b.x || a.y === b.y).toBe(true)
        expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThan(0)
        for (const p of [a, b]) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(GRID_SIZE)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(GRID_SIZE)
        }
      }
    }
  })

  /**
   * The circle pair is the ONLY thing that identifies a maze in game. If two
   * mazes shared a pair, the module would be unsolvable — so this is a real
   * check on the transcription, not a tautology.
   */
  it('no two mazes share the same circle pair', () => {
    const seen = new Set<string>()
    for (const maze of MAZES) {
      const key = maze.circles
        .map((c) => `${c.x},${c.y}`)
        .sort()
        .join('|')
      expect(seen.has(key), `duplicate circle pair ${key}`).toBe(false)
      seen.add(key)
    }
  })

  it('a maze can be identified from its circles in either order', () => {
    MAZES.forEach((maze, idx) => {
      expect(findMazeByCircles(maze.circles)).toBe(idx)
      expect(findMazeByCircles([...maze.circles].reverse())).toBe(idx)
    })
  })

  it('an unknown circle pair identifies nothing', () => {
    expect(findMazeByCircles([{ x: 0, y: 0 }, { x: 0, y: 1 }])).toBe(-1)
  })
})

/**
 * The property that makes a maze a maze: every square is reachable from every
 * other. A transcription error that walls off a corner would show up here and
 * nowhere else — the drill would simply become unsolvable for some pairs.
 */
describe('every maze is fully connected', () => {
  MAZES.forEach((maze, idx) => {
    it(`maze ${idx + 1}: all 36 squares reach each other`, () => {
      const cells = allCells()
      const start = cells[0]!
      for (const cell of cells) {
        const path = shortestPath(maze, start, cell)
        expect(path, `(${cell.x},${cell.y}) unreachable`).not.toBeNull()
      }
    })
  })

  it('every listed goal is reachable from every square', () => {
    for (const maze of MAZES) {
      for (const goal of maze.goals) {
        for (const cell of allCells()) {
          expect(shortestPath(maze, cell, goal)).not.toBeNull()
        }
      }
    }
  })
})

describe('movement', () => {
  it('walls block symmetrically — if A cannot reach B, B cannot reach A', () => {
    for (const maze of MAZES) {
      for (const cell of allCells()) {
        for (const dir of DIRECTIONS) {
          const result = move(maze, cell, dir)
          if (result.kind !== 'moved') continue
          const back = move(maze, result.position, opposite(dir))
          expect(back.kind).toBe('moved')
          if (back.kind === 'moved') expect(equal(back.position, cell)).toBe(true)
        }
      }
    }
  })

  it('reports the edge of the grid rather than moving off it', () => {
    const maze = MAZES[0]!
    expect(move(maze, { x: 0, y: 0 }, 'up').kind).toBe('edge')
    expect(move(maze, { x: 0, y: 0 }, 'left').kind).toBe('edge')
    expect(move(maze, { x: 5, y: 5 }, 'down').kind).toBe('edge')
    expect(move(maze, { x: 5, y: 5 }, 'right').kind).toBe('edge')
  })

  it('names the wall that blocked a move', () => {
    // Maze 1 has a wall along the top of (1,1)-(2,1): w(1,1,2,1).
    const maze = MAZES[0]!
    const result = move(maze, { x: 1, y: 1 }, 'up')
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked') {
      expect(result.wall).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }])
    }
  })

  it('a move is never both legal and blocked', () => {
    for (const maze of MAZES) {
      for (const cell of allCells()) {
        for (const dir of DIRECTIONS) {
          const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir]
          const to = { x: cell.x + delta[0]!, y: cell.y + delta[1]! }
          const result = move(maze, cell, dir)
          if (to.x < 0 || to.y < 0 || to.x >= GRID_SIZE || to.y >= GRID_SIZE) {
            expect(result.kind).toBe('edge')
          } else {
            expect(result.kind).toBe(canMove(maze, cell, to) ? 'moved' : 'blocked')
          }
        }
      }
    }
  })
})

describe('generate', () => {
  it('never starts you on the goal, and the goal is always reachable', () => {
    for (let seed = 0; seed < 500; seed++) {
      const round = generate(seeded(seed))
      expect(equal(round.position, round.goal)).toBe(false)
      const maze = MAZES[round.mazeIndex]!
      expect(shortestPath(maze, round.position, round.goal)).not.toBeNull()
      expect(contains(maze.goals, round.goal)).toBe(true)
    }
  })

  it('anywhere mode can target squares outside the listed goals', () => {
    let offList = 0
    for (let seed = 0; seed < 300; seed++) {
      const round = generate(seeded(seed), 0, true)
      if (!contains(MAZES[0]!.goals, round.goal)) offList++
    }
    expect(offList).toBeGreaterThan(0)
  })

  it('reaches every maze', () => {
    const seen = new Set<number>()
    for (let seed = 0; seed < 500; seed++) seen.add(generate(seeded(seed)).mazeIndex)
    expect(seen.size).toBe(MAZES.length)
  })
})

function opposite(dir: (typeof DIRECTIONS)[number]) {
  return { up: 'down', down: 'up', left: 'right', right: 'left' }[dir] as (typeof DIRECTIONS)[number]
}
