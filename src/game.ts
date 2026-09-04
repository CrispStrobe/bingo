export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
export type Letter = (typeof LETTERS)[number]

export const SIZE = 5
export const MAX_BALL = 75
export const FREE = 0 // sentinel for the free centre square

export type Cell = { value: number; marked: boolean }

export type Player = {
  id: number
  name: string
  accent: string
  grid: Cell[] // 25 cells, row-major
  misses: number
  wins: number
  lines: number[] // indices of completed lines (see LINES)
}

/** Letter for a ball number: 1-15 = B, 16-30 = I, ... */
export function letterFor(n: number): Letter {
  return LETTERS[Math.floor((n - 1) / 15)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Standard 75-ball card: column c draws 5 distinct numbers from c*15+1 .. c*15+15. */
export function makeGrid(): Cell[] {
  const grid: Cell[] = new Array(SIZE * SIZE)
  for (let col = 0; col < SIZE; col++) {
    const pool = shuffle(Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)).slice(0, SIZE)
    for (let row = 0; row < SIZE; row++) {
      grid[row * SIZE + col] = { value: pool[row], marked: false }
    }
  }
  const centre = 2 * SIZE + 2
  grid[centre] = { value: FREE, marked: true }
  return grid
}

/** All 12 winning lines: 5 rows, 5 columns, 2 diagonals. */
export const LINES: number[][] = (() => {
  const lines: number[][] = []
  for (let r = 0; r < SIZE; r++) lines.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c))
  for (let c = 0; c < SIZE; c++) lines.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + i))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)))
  return lines
})()

export function completedLines(grid: Cell[]): number[] {
  const done: number[] = []
  LINES.forEach((line, i) => {
    if (line.every((idx) => grid[idx].marked)) done.push(i)
  })
  return done
}

/** Cells that are on the card, already called, and not yet daubed. */
export function pendingCount(grid: Cell[], called: Set<number>): number {
  return grid.filter((c) => c.value !== FREE && !c.marked && called.has(c.value)).length
}

/** How many more marks the player needs on their closest line. */
export function distanceToBingo(grid: Cell[]): number {
  let best = SIZE
  for (const line of LINES) {
    const need = line.reduce((acc, idx) => acc + (grid[idx].marked ? 0 : 1), 0)
    if (need < best) best = need
  }
  return best
}

export function newBag(): number[] {
  return shuffle(Array.from({ length: MAX_BALL }, (_, i) => i + 1))
}

export const ACCENTS = ['#ff4d8d', '#22d3ee', '#facc15'] as const
export const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3']

export function makePlayers(names = DEFAULT_NAMES, wins = [0, 0, 0]): Player[] {
  return names.map((name, i) => ({
    id: i,
    name,
    accent: ACCENTS[i % ACCENTS.length],
    grid: makeGrid(),
    misses: 0,
    wins: wins[i] ?? 0,
    lines: [],
  }))
}
