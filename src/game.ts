// Pure game engine: no React, no DOM, no randomness outside the two makers.
// Everything here is JSON-serialisable so the same state and the same reducer
// can run on a LAN host and be mirrored to joined devices.

export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
export type Letter = (typeof LETTERS)[number]

export const SIZE = 5
export const MAX_BALL = 75
export const FREE = 0 // sentinel for the free centre square
export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 8

export type Cell = { value: number; marked: boolean }

export type Player = {
  id: number
  name: string
  accent: string
  grid: Cell[] // 25 cells, row-major
  misses: number
  wins: number
  won: number[] // indices of satisfied pattern targets, set when the round is won
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
  grid[centreIndex()] = { value: FREE, marked: true }
  return grid
}

export function centreIndex(): number {
  return Math.floor(SIZE / 2) * SIZE + Math.floor(SIZE / 2)
}

// ---------------------------------------------------------------------------
// Winning patterns
// ---------------------------------------------------------------------------

export const PATTERNS = ['line', 'corners', 'x', 'blackout'] as const
export type Pattern = (typeof PATTERNS)[number]

const rows = Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => r * SIZE + c))
const cols = Array.from({ length: SIZE }, (_, c) => Array.from({ length: SIZE }, (_, r) => r * SIZE + c))
const diagDown = Array.from({ length: SIZE }, (_, i) => i * SIZE + i)
const diagUp = Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i))

/** Every cell-set that wins, per pattern. Satisfying ONE of them is a bingo. */
export const PATTERN_TARGETS: Record<Pattern, number[][]> = {
  line: [...rows, ...cols, diagDown, diagUp],
  corners: [[0, SIZE - 1, SIZE * (SIZE - 1), SIZE * SIZE - 1]],
  x: [[...new Set([...diagDown, ...diagUp])]],
  blackout: [Array.from({ length: SIZE * SIZE }, (_, i) => i)],
}

/** A small illustrative shape for the pattern picker (not the full rule set). */
export const PATTERN_PREVIEW: Record<Pattern, number[]> = {
  line: rows[2],
  corners: PATTERN_TARGETS.corners[0],
  x: PATTERN_TARGETS.x[0],
  blackout: PATTERN_TARGETS.blackout[0],
}

/** Indices into PATTERN_TARGETS[pattern] that this grid has fully marked. */
export function completedTargets(grid: Cell[], pattern: Pattern): number[] {
  const done: number[] = []
  PATTERN_TARGETS[pattern].forEach((target, i) => {
    if (target.every((idx) => grid[idx].marked)) done.push(i)
  })
  return done
}

export function winningCells(grid: Cell[], pattern: Pattern, targets: number[]): Set<number> {
  const cells = new Set<number>()
  targets.forEach((t) => PATTERN_TARGETS[pattern][t].forEach((i) => cells.add(i)))
  void grid
  return cells
}

/** Cells that are on the card, already called, and not yet daubed. */
export function pendingCount(grid: Cell[], called: Set<number>): number {
  return grid.filter((c) => c.value !== FREE && !c.marked && called.has(c.value)).length
}

/** How many more marks the closest winning set still needs. */
export function distanceToBingo(grid: Cell[], pattern: Pattern): number {
  let best = Number.POSITIVE_INFINITY
  for (const target of PATTERN_TARGETS[pattern]) {
    const need = target.reduce((acc, idx) => acc + (grid[idx].marked ? 0 : 1), 0)
    if (need < best) best = need
  }
  return best
}

export function newBag(): number[] {
  return shuffle(Array.from({ length: MAX_BALL }, (_, i) => i + 1))
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export const ACCENTS = [
  '#ff4d8d',
  '#22d3ee',
  '#facc15',
  '#a3e635',
  '#c084fc',
  '#fb923c',
  '#38bdf8',
  '#f472b6',
] as const

export function makePlayer(id: number, name: string, wins = 0): Player {
  return { id, name, accent: ACCENTS[id % ACCENTS.length], grid: makeGrid(), misses: 0, wins, won: [] }
}

// ---------------------------------------------------------------------------
// State + reducer — pure, so a host can run it and mirror the result
// ---------------------------------------------------------------------------

export type GameState = {
  round: number
  players: Player[]
  bag: number[]
  drawn: number[]
  winners: number[]
  pattern: Pattern
  autoDraw: boolean
  autoDaub: boolean
  speed: number
  modalOpen: boolean
}

export type Action =
  | { type: 'draw' }
  | { type: 'daub'; player: number; cell: number }
  | { type: 'miss'; player: number }
  | { type: 'rename'; player: number; name: string }
  | { type: 'addPlayer'; name: string }
  | { type: 'removePlayer'; player: number }
  | { type: 'setPattern'; pattern: Pattern }
  | { type: 'newRound' }
  | { type: 'resetScores' }
  | { type: 'setAutoDraw'; value: boolean }
  | { type: 'setAutoDaub'; value: boolean }
  | { type: 'speed'; value: number }
  | { type: 'closeModal' }

export function makeGame(names: string[], wins: number[] = [], pattern: Pattern = 'line'): GameState {
  return {
    round: 1,
    players: names.map((name, i) => makePlayer(i, name, wins[i] ?? 0)),
    bag: newBag(),
    drawn: [],
    winners: [],
    pattern,
    autoDraw: false,
    autoDaub: false,
    speed: 3500,
    modalOpen: false,
  }
}

/** Award the round to every player whose card now satisfies the pattern. */
function settle(state: GameState, players: Player[]): GameState {
  const winners: number[] = []
  const scored = players.map((p) => {
    const done = completedTargets(p.grid, state.pattern)
    if (done.length) {
      winners.push(p.id)
      return { ...p, won: done, wins: p.wins + 1 }
    }
    return p
  })
  if (!winners.length) return { ...state, players }
  return { ...state, players: scored, winners, autoDraw: false, modalOpen: true }
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'draw': {
      if (state.winners.length || !state.bag.length) return state
      const bag = state.bag.slice(0, -1)
      const ball = state.bag[state.bag.length - 1]
      const next = { ...state, bag, drawn: [...state.drawn, ball], autoDraw: bag.length ? state.autoDraw : false }
      if (!state.autoDaub) return next
      return settle(
        next,
        next.players.map((p) => ({
          ...p,
          grid: p.grid.map((c) => (c.value === ball ? { ...c, marked: true } : c)),
        })),
      )
    }

    case 'daub': {
      if (state.winners.length) return state
      return settle(
        state,
        state.players.map((p) =>
          p.id === action.player
            ? { ...p, grid: p.grid.map((c, i) => (i === action.cell ? { ...c, marked: true } : c)) }
            : p,
        ),
      )
    }

    case 'miss':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.player ? { ...p, misses: p.misses + 1 } : p)),
      }

    case 'rename':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.player ? { ...p, name: action.name } : p)),
      }

    case 'addPlayer': {
      if (state.players.length >= MAX_PLAYERS) return state
      const id = state.players.length
      return { ...state, players: [...state.players, makePlayer(id, action.name)] }
    }

    case 'removePlayer': {
      if (state.players.length <= MIN_PLAYERS) return state
      // ids are positional, so renumber after a removal
      const players = state.players
        .filter((p) => p.id !== action.player)
        .map((p, i) => ({ ...p, id: i, accent: ACCENTS[i % ACCENTS.length] }))
      return { ...state, players, winners: state.winners.filter((w) => w < players.length) }
    }

    case 'setPattern':
      // changing the goal mid-round would be unfair, so it restarts the round
      return {
        ...reduce({ ...state, pattern: action.pattern }, { type: 'newRound' }),
        round: state.round,
      }

    case 'newRound':
      return {
        ...state,
        round: state.round + 1,
        players: state.players.map((p) => ({ ...p, grid: makeGrid(), misses: 0, won: [] })),
        bag: newBag(),
        drawn: [],
        winners: [],
        autoDraw: false,
        modalOpen: false,
      }

    case 'resetScores':
      return { ...state, players: state.players.map((p) => ({ ...p, wins: 0 })) }

    case 'setAutoDraw':
      return { ...state, autoDraw: action.value }

    case 'setAutoDaub':
      return { ...state, autoDaub: action.value }

    case 'speed':
      return { ...state, speed: action.value }

    case 'closeModal':
      return { ...state, modalOpen: false }
  }
}
