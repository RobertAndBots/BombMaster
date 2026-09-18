/**
 * Mazes — manual p15.
 *
 * Nine 6x6 mazes. The module never shows you the walls: it shows two circles,
 * and those identify which of the nine maze layouts you are in. You then
 * navigate from the white light to the red triangle from memory.
 *
 * So this is the one module where "memorize the manual" means memorizing nine
 * pictures, and the drill has to be a navigator that hides the walls — which
 * is exactly what the study page does.
 *
 * Coordinates are (x, y) with the origin at the TOP-LEFT, x rightwards and y
 * downwards, matching the manual's page and the canvas it is drawn on. A wall
 * is a segment between two lattice points on the grid *lines*, so its
 * coordinates run 0..6 while cell coordinates run 0..5.
 *
 * The data below is the original `src/maze/mazes.js`, transformed
 * mechanically rather than retyped — 9 layouts, 129 walls and 67 goal squares
 * is far too much hand-transcription to trust.
 */

export type Point = { x: number; y: number }

/** A wall segment between two lattice points. */
export type Wall = [Point, Point]

export type Maze = {
  /** The two circle markers that identify this maze. */
  circles: Point[]
  walls: Wall[]
  /** Squares the game uses as targets, for generating realistic drills. */
  goals: Point[]
}

export const GRID_SIZE = 6

const p = (x: number, y: number): Point => ({ x, y })
const w = (x1: number, y1: number, x2: number, y2: number): Wall => [p(x1, y1), p(x2, y2)]

export const MAZES: Maze[] = [
    {
        circles: [p(0, 1), p(5, 2)],
        walls: [
            w(1, 1, 2, 1),
            w(4, 1, 6, 1),
            w(2, 2, 5, 2),
            w(1, 3, 2, 3),
            w(4, 3, 5, 3),
            w(1, 4, 5, 4),
            w(1, 5, 2, 5),
            w(4, 5, 5, 5),
            w(1, 1, 1, 4),
            w(2, 5, 2, 6),
            w(3, 0, 3, 3),
            w(3, 4, 3, 5),
            w(4, 5, 4, 6),
            w(5, 4, 5, 5),
            w(4, 3, 4, 4)
        ],
        goals: [p(1, 5), p(4, 4), p(1, 3), p(5, 0), p(4, 3), p(4, 5)]
    },
    {
        circles: [p(4, 1), p(1, 3)],
        walls: [
            w(0, 1, 1, 1),
            w(2, 1, 3, 1),
            w(3, 0, 3, 1),
            w(2, 1, 2, 2),
            w(1, 2, 2, 2),
            w(1, 2, 1, 3),
            w(1, 4, 1, 6),
            w(1, 4, 2, 4),
            w(2, 3, 2, 5),
            w(2, 3, 3, 3),
            w(3, 2, 3, 3),
            w(3, 2, 5, 2),
            w(4, 1, 4, 2),
            w(5, 1, 6, 1),
            w(5, 3, 5, 5),
            w(4, 3, 5, 3),
            w(4, 3, 4, 4),
            w(3, 4, 4, 4),
            w(3, 4, 3, 6),
            w(4, 5, 5, 5)
        ],
        goals: [p(0, 0), p(2, 0), p(0, 5), p(5, 0), p(4, 3), p(1, 4)]
    },
    {
        circles: [p(3, 3), p(5, 3)],
        walls: [
            w(0, 2, 1, 2),
            w(1, 1, 1, 2),
            w(1, 1, 2, 1),
            w(2, 1, 2, 4),
            w(1, 3, 1, 5),
            w(1, 5, 3, 5),
            w(3, 0, 3, 5),
            w(3, 2, 5, 2),
            w(4, 0, 4, 1),
            w(5, 1, 5, 5),
            w(4, 3, 4, 6)
        ],
        goals: [p(0, 1), p(1, 1), p(3, 0)]
    },
    {
        circles: [p(0, 0), p(0, 3)],
        walls: [
            w(1, 1, 1, 4),
            w(2, 0, 2, 2),
            w(2, 1, 5, 1),
            w(1, 3, 3, 3),
            w(3, 2, 3, 3),
            w(3, 2, 5, 2),
            w(5, 2, 5, 3),
            w(4, 3, 5, 3),
            w(1, 4, 5, 4),
            w(1, 5, 4, 5),
            w(5, 4, 5, 6),
            w(3, 5, 3, 6)
        ],
        goals: [p(2, 5), p(3, 5), p(2, 0), p(5, 5), p(1, 3), p(4, 2)]
    },
    {
        circles: [p(4, 2), p(3, 5)],
        walls: [
            w(0, 1, 4, 1),
            w(5, 1, 5, 2),
            w(1, 2, 3, 2),
            w(2, 2, 2, 3),
            w(2, 3, 4, 3),
            w(4, 2, 6, 2),
            w(4, 2, 4, 4),
            w(4, 4, 5, 4),
            w(5, 3, 5, 5),
            w(2, 5, 5, 5),
            w(1, 3, 1, 6),
            w(1, 4, 3, 4)
        ],
        goals: [p(0, 0), p(5, 1), p(2, 2), p(0, 5), p(4, 4), p(4, 3)]
    },
    {
        circles: [p(4, 0), p(2, 4)],
        walls: [
            w(1, 0, 1, 2),
            w(2, 1, 2, 5),
            w(3, 0, 3, 3),
            w(1, 3, 3, 3),
            w(0, 4, 1, 4),
            w(1, 5, 3, 5),
            w(3, 4, 3, 5),
            w(4, 2, 4, 6),
            w(3, 1, 4, 1),
            w(5, 1, 5, 2),
            w(4, 2, 5, 2),
            w(5, 3, 6, 3),
            w(5, 3, 5, 4),
            w(4, 5, 5, 5)
        ],
        goals: [p(0, 0), p(2, 2), p(2, 4), p(3, 0), p(5, 3), p(4, 5)]
    },
    {
        circles: [p(1, 0), p(1, 5)],
        walls: [
            w(1, 1, 3, 1),
            w(1, 1, 1, 2),
            w(3, 1, 3, 2),
            w(4, 0, 4, 1),
            w(5, 1, 5, 2),
            w(2, 2, 5, 2),
            w(0, 3, 2, 3),
            w(2, 2, 2, 5),
            w(1, 4, 1, 5),
            w(1, 5, 4, 5),
            w(5, 3, 5, 5),
            w(5, 3, 6, 3),
            w(4, 2, 4, 3),
            w(3, 3, 4, 3),
            w(3, 4, 5, 4)
        ],
        goals: [p(2, 1), p(3, 2), p(5, 3), p(1, 4)]
    },
    {
        circles: [p(3, 0), p(2, 3)],
        walls: [
            w(1, 0, 1, 1),
            w(2, 1, 3, 1),
            w(3, 1, 3, 2),
            w(1, 2, 5, 2),
            w(4, 0, 4, 1),
            w(5, 1, 5, 3),
            w(1, 2, 1, 5),
            w(1, 4, 2, 4),
            w(2, 4, 2, 5),
            w(2, 5, 6, 5),
            w(2, 3, 4, 3),
            w(3, 3, 3, 4),
            w(3, 4, 6, 4)
        ],
        goals: [p(0, 0), p(1, 4), p(5, 5), p(2, 1), p(3, 3), p(5, 4)]
    },
    {
        circles: [p(0, 4), p(2, 1)],
        walls: [
            w(1, 0, 1, 2),
            w(1, 3, 1, 5),
            w(1, 3, 3, 3),
            w(2, 3, 2, 6),
            w(2, 1, 2, 2),
            w(2, 1, 4, 1),
            w(4, 1, 4, 2),
            w(3, 2, 4, 2),
            w(3, 2, 3, 3),
            w(5, 1, 5, 3),
            w(4, 3, 5, 3),
            w(4, 3, 4, 4),
            w(3, 4, 5, 4),
            w(3, 4, 3, 5),
            w(4, 5, 4, 6),
            w(5, 4, 5, 5),
            w(5, 5, 6, 5)
        ],
        goals: [p(0, 0), p(1, 3), p(3, 1), p(5, 4), p(4, 3), p(5, 5)]
    }
];
