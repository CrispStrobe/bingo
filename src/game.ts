// Pure, serialisable game engine shared by the local screen and LAN host.
export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
export type Letter = (typeof LETTERS)[number]
export type Variant = '75' | '90' | 'tombola'
export const FREE = 0
export const BLANK = -1
export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 8
export const MIN_TICKETS = 1
export const MAX_TICKETS = 6

export type Cell = { value: number; marked: boolean }
export type Ticket = { id: number; grid: Cell[] }
export type TicketWin = { ticket: number; targets: number[] }
export type Player = { id: number; name: string; accent: string; tickets: Ticket[]; misses: number; wins: number; won: TicketWin[] }

export const PATTERNS_75 = ['line', 'corners', 'x', 'blackout'] as const
export const PATTERNS_90 = ['oneLine', 'twoLines', 'fullHouse'] as const
export const PATTERNS_TOMBOLA = ['ambo', 'terno', 'quaterna', 'cinquina', 'tombola'] as const
export const PATTERNS = [...PATTERNS_75, ...PATTERNS_90, ...PATTERNS_TOMBOLA] as const
export type Pattern = (typeof PATTERNS)[number]

export const dimensions = (variant: Variant) => variant === '75' ? { rows: 5, cols: 5 } : { rows: 3, cols: 9 }
export const maxBall = (variant: Variant) => variant === '75' ? 75 : 90
export const patternsFor = (variant: Variant): readonly Pattern[] => variant === '75' ? PATTERNS_75 : variant === '90' ? PATTERNS_90 : PATTERNS_TOMBOLA
export const defaultPattern = (variant: Variant): Pattern => variant === '75' ? 'line' : variant === '90' ? 'oneLine' : 'ambo'
export const isNinetyBall = (variant: Variant): boolean => variant !== '75'
export const nextTombolaPattern = (pattern: Pattern): Pattern | null => {
  const index = PATTERNS_TOMBOLA.indexOf(pattern as (typeof PATTERNS_TOMBOLA)[number])
  return index >= 0 && index < PATTERNS_TOMBOLA.length - 1 ? PATTERNS_TOMBOLA[index + 1] : null
}

/** B-I-N-G-O applies only to the American 75-ball variant. */
export function letterFor(n: number, variant: Variant = '75'): Letter | '' {
  return variant === '75' ? LETTERS[Math.floor((n - 1) / 15)] : ''
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Unbiased platform randomness when available, with a test/legacy fallback. */
function randomIndex(exclusiveMax: number): number {
  const source = globalThis.crypto
  if (!source?.getRandomValues) return Math.floor(Math.random() * exclusiveMax)
  const range = 0x1_0000_0000
  const limit = Math.floor(range / exclusiveMax) * exclusiveMax
  const word = new Uint32Array(1)
  do source.getRandomValues(word); while (word[0] >= limit)
  return word[0] % exclusiveMax
}

function make75Grid(): Cell[] {
  const grid: Cell[] = new Array(25)
  for (let col = 0; col < 5; col++) {
    const pool = shuffle(Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)).slice(0, 5)
    for (let row = 0; row < 5; row++) grid[row * 5 + col] = { value: pool[row], marked: false }
  }
  grid[12] = { value: FREE, marked: true }
  return grid
}

function rowMasks(count: number): number[][] {
  const masks: number[][] = []
  for (let bits = 1; bits < 8; bits++) {
    const rows = [0, 1, 2].filter((r) => bits & (1 << r))
    if (rows.length === count) masks.push(rows)
  }
  return shuffle(masks)
}

/** UK/European 90-ball ticket: 3×9, five numbers per row and 1–3 per column. */
function random90Counts(): number[] {
  const counts = Array(9).fill(1) as number[]
  let extras = 6
  while (extras) {
    const col = randomIndex(9)
    if (counts[col] < 3) { counts[col]++; extras-- }
  }
  return counts
}

function placementsFor(counts: number[]): number[][] | null {
  const placements: number[][] = []
  const used = [0, 0, 0]
  const place = (col: number): boolean => {
    if (col === 9) return used.every((n) => n === 5)
    for (const rows of rowMasks(counts[col])) {
      if (rows.some((r) => used[r] >= 5)) continue
      rows.forEach((r) => used[r]++)
      placements[col] = rows
      if (place(col + 1)) return true
      rows.forEach((r) => used[r]--)
    }
    return false
  }
  return place(0) ? placements : null
}

function gridFrom90Columns(counts: number[], columns?: number[][]): Cell[] | null {
  const placements = placementsFor(counts)
  if (!placements) return null
  const grid = Array.from({ length: 27 }, () => ({ value: BLANK, marked: false }))
  placements.forEach((rows, col) => {
    const start = col === 0 ? 1 : col * 10
    const end = col === 8 ? 90 : col * 10 + 9
    const nums = (columns?.[col] ?? shuffle(Array.from({ length: end - start + 1 }, (_, i) => start + i)).slice(0, rows.length)).slice().sort((a, b) => a - b)
    rows.sort((a, b) => a - b).forEach((row, i) => { grid[row * 9 + col] = { value: nums[i], marked: false } })
  })
  return grid
}

function make90Grid(): Cell[] { return gridFrom90Columns(random90Counts()) ?? make90Grid() }

function countPlans(total: number, length = 6): number[][] {
  const result: number[][] = []
  const visit = (values: number[], remaining: number) => {
    if (values.length === length) {
      if (remaining === 0) result.push(values)
      return
    }
    const slots = length - values.length - 1
    for (let value = 1; value <= 3; value++) {
      if (remaining - value < slots || remaining - value > slots * 3) continue
      visit([...values, value], remaining - value)
    }
  }
  visit([], total)
  return shuffle(result)
}

/** A traditional six-ticket strip: every number from 1–90 occurs exactly once. */
export function make90Strip(): Ticket[] {
  const columnTotals = [9, 10, 10, 10, 10, 10, 10, 10, 11]
  const counts = Array.from({ length: 6 }, () => Array(9).fill(0) as number[])
  const ticketTotals = Array(6).fill(0) as number[]
  const assign = (col: number): boolean => {
    if (col === 9) return ticketTotals.every((total) => total === 15)
    const remainingColumns = 8 - col
    for (const plan of countPlans(columnTotals[col])) {
      if (plan.some((value, ticket) => {
        const total = ticketTotals[ticket] + value
        return total > 15 || total + remainingColumns > 15 || total + remainingColumns * 3 < 15
      })) continue
      plan.forEach((value, ticket) => { counts[ticket][col] = value; ticketTotals[ticket] += value })
      if (assign(col + 1)) return true
      plan.forEach((value, ticket) => { counts[ticket][col] = 0; ticketTotals[ticket] -= value })
    }
    return false
  }
  if (!assign(0)) return make90Strip()

  const columnsByTicket = Array.from({ length: 6 }, () => Array.from({ length: 9 }, () => [] as number[]))
  columnTotals.forEach((total, col) => {
    const start = col === 0 ? 1 : col * 10
    const numbers = shuffle(Array.from({ length: total }, (_, i) => start + i))
    let offset = 0
    for (let ticket = 0; ticket < 6; ticket++) {
      const count = counts[ticket][col]
      columnsByTicket[ticket][col] = numbers.slice(offset, offset + count)
      offset += count
    }
  })
  const grids = counts.map((ticketCounts, ticket) => gridFrom90Columns(ticketCounts, columnsByTicket[ticket]))
  if (grids.some((grid) => !grid)) return make90Strip()
  return grids.map((grid, id) => ({ id, grid: grid! }))
}

export function makeGrid(variant: Variant = '75'): Cell[] { return variant === '75' ? make75Grid() : make90Grid() }

function targetsFor(pattern: Pattern, variant: Variant): number[][] {
  if (isNinetyBall(variant)) {
    if (pattern === 'tombola') return [Array.from({ length: 27 }, (_, i) => i)]
    return Array.from({ length: 3 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c))
  }
  const rows = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r * 5 + c))
  const cols = Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => r * 5 + c))
  const down = Array.from({ length: 5 }, (_, i) => i * 5 + i)
  const up = Array.from({ length: 5 }, (_, i) => i * 5 + 4 - i)
  if (pattern === 'corners') return [[0, 4, 20, 24]]
  if (pattern === 'x') return [[...new Set([...down, ...up])]]
  if (pattern === 'blackout') return [Array.from({ length: 25 }, (_, i) => i)]
  return [...rows, ...cols, down, up]
}

function targetRequirement(pattern: Pattern): number { return pattern === 'twoLines' ? 2 : pattern === 'fullHouse' ? 3 : 1 }
function marksRequired(pattern: Pattern): number | null {
  if (pattern === 'ambo') return 2
  if (pattern === 'terno') return 3
  if (pattern === 'quaterna') return 4
  if (pattern === 'cinquina') return 5
  return null
}

export function completedTargets(grid: Cell[], pattern: Pattern, variant: Variant = '75'): number[] {
  const done: number[] = []
  targetsFor(pattern, variant).forEach((target, i) => {
    const required = marksRequired(pattern)
    const marked = target.filter((idx) => grid[idx].value !== BLANK && grid[idx].marked).length
    if (required ? marked >= required : target.every((idx) => grid[idx].value === BLANK || grid[idx].marked)) done.push(i)
  })
  return done
}

export function ticketHasWon(grid: Cell[], pattern: Pattern, variant: Variant): boolean {
  return completedTargets(grid, pattern, variant).length >= targetRequirement(pattern)
}
export function winningCells(grid: Cell[], pattern: Pattern, targets: number[], variant: Variant = '75'): Set<number> {
  const cells = new Set<number>()
  const partial = marksRequired(pattern) !== null
  targets.forEach((t) => targetsFor(pattern, variant)[t]?.forEach((i) => { if (grid[i].value !== BLANK && (!partial || grid[i].marked)) cells.add(i) }))
  return cells
}
export function pendingCount(grid: Cell[], called: Set<number>): number { return grid.filter((c) => c.value > 0 && !c.marked && called.has(c.value)).length }
export function distanceToBingo(grid: Cell[], pattern: Pattern, variant: Variant = '75'): number {
  const threshold = marksRequired(pattern)
  const needs = targetsFor(pattern, variant).map((target) => threshold === null
    ? target.reduce((n, idx) => n + (grid[idx].value === BLANK || grid[idx].marked ? 0 : 1), 0)
    : Math.max(0, threshold - target.filter((idx) => grid[idx].value !== BLANK && grid[idx].marked).length)).sort((a, b) => a - b)
  return needs.slice(0, targetRequirement(pattern)).reduce((a, b) => a + b, 0)
}
export function playerDistance(player: Player, pattern: Pattern, variant: Variant): number { return Math.min(...player.tickets.map((t) => distanceToBingo(t.grid, pattern, variant))) }
export function newBag(variant: Variant = '75'): number[] { return shuffle(Array.from({ length: maxBall(variant) }, (_, i) => i + 1)) }

export const ACCENTS = ['#ff4d8d', '#22d3ee', '#facc15', '#a3e635', '#c084fc', '#fb923c', '#38bdf8', '#f472b6'] as const
function makeTickets(count: number, variant: Variant): Ticket[] {
  if (variant === 'tombola') return make90Strip().slice(0, count)
  return Array.from({ length: count }, (_, id) => ({ id, grid: makeGrid(variant) }))
}
export function makePlayer(id: number, name: string, wins = 0, variant: Variant = '75', ticketCount = 1): Player {
  return { id, name, accent: ACCENTS[id % ACCENTS.length], tickets: makeTickets(ticketCount, variant), misses: 0, wins, won: [] }
}

export type GameState = { round: number; players: Player[]; bag: number[]; drawn: number[]; winners: number[]; pattern: Pattern; variant: Variant; ticketCount: number; showLetters: boolean; autoDraw: boolean; autoDaub: boolean; speed: number; modalOpen: boolean }
export type Action =
  | { type: 'draw' }
  | { type: 'daub'; player: number; ticket: number; cell: number }
  | { type: 'miss'; player: number }
  | { type: 'rename'; player: number; name: string }
  | { type: 'addPlayer'; name: string }
  | { type: 'removePlayer'; player: number }
  | { type: 'setPattern'; pattern: Pattern }
  | { type: 'setVariant'; variant: Variant }
  | { type: 'setTicketCount'; value: number }
  | { type: 'setShowLetters'; value: boolean }
  | { type: 'nextPrize' }
  | { type: 'newRound' }
  | { type: 'resetScores' }
  | { type: 'setAutoDraw'; value: boolean }
  | { type: 'setAutoDaub'; value: boolean }
  | { type: 'speed'; value: number }
  | { type: 'closeModal' }

export function makeGame(names: string[], wins: number[] = [], pattern: Pattern = 'line', variant: Variant = '75', ticketCount = 1): GameState {
  const validPattern = patternsFor(variant).includes(pattern) ? pattern : defaultPattern(variant)
  return { round: 1, players: names.map((name, i) => makePlayer(i, name, wins[i] ?? 0, variant, ticketCount)), bag: newBag(variant), drawn: [], winners: [], pattern: validPattern, variant, ticketCount, showLetters: true, autoDraw: false, autoDaub: false, speed: 3500, modalOpen: false }
}

function settle(state: GameState, players: Player[]): GameState {
  const winners: number[] = []
  const scored = players.map((p) => {
    const won = p.tickets.flatMap((ticket) => {
      const targets = completedTargets(ticket.grid, state.pattern, state.variant)
      return targets.length >= targetRequirement(state.pattern) ? [{ ticket: ticket.id, targets }] : []
    })
    if (!won.length) return { ...p, won: [] }
    winners.push(p.id)
    return { ...p, won, wins: p.wins + 1 }
  })
  return winners.length ? { ...state, players: scored, winners, autoDraw: false, modalOpen: true } : { ...state, players }
}
function freshRound(state: GameState, increment = true): GameState {
  return { ...state, round: state.round + (increment ? 1 : 0), players: state.players.map((p) => ({ ...p, tickets: makeTickets(state.ticketCount, state.variant), misses: 0, won: [] })), bag: newBag(state.variant), drawn: [], winners: [], autoDraw: false, modalOpen: false }
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'draw': {
      if (state.winners.length || !state.bag.length) return state
      const bag = state.bag.slice(0, -1); const ball = state.bag[state.bag.length - 1]
      const next = { ...state, bag, drawn: [...state.drawn, ball], autoDraw: bag.length ? state.autoDraw : false }
      if (!state.autoDaub) return next
      return settle(next, next.players.map((p) => ({ ...p, tickets: p.tickets.map((t) => ({ ...t, grid: t.grid.map((c) => c.value === ball ? { ...c, marked: true } : c) })) })))
    }
    case 'daub':
      if (state.winners.length) return state
      {
        const cell = state.players[action.player]?.tickets[action.ticket]?.grid[action.cell]
        if (!cell || cell.value <= 0 || cell.marked || !state.drawn.includes(cell.value)) return state
      return settle(state, state.players.map((p) => p.id !== action.player ? p : ({ ...p, tickets: p.tickets.map((t) => t.id !== action.ticket ? t : ({ ...t, grid: t.grid.map((c, i) => i === action.cell ? { ...c, marked: true } : c) })) })))
      }
    case 'miss': return { ...state, players: state.players.map((p) => p.id === action.player ? { ...p, misses: p.misses + 1 } : p) }
    case 'rename': return { ...state, players: state.players.map((p) => p.id === action.player ? { ...p, name: action.name.slice(0, 14) } : p) }
    case 'addPlayer': return state.players.length >= MAX_PLAYERS ? state : { ...state, players: [...state.players, makePlayer(state.players.length, action.name, 0, state.variant, state.ticketCount)] }
    case 'removePlayer': {
      if (state.players.length <= MIN_PLAYERS) return state
      const players = state.players.filter((p) => p.id !== action.player).map((p, i) => ({ ...p, id: i, accent: ACCENTS[i % ACCENTS.length] }))
      return { ...state, players, winners: [] }
    }
    case 'setPattern': return patternsFor(state.variant).includes(action.pattern) ? freshRound({ ...state, pattern: action.pattern }, false) : state
    case 'setVariant': return freshRound({ ...state, variant: action.variant, pattern: defaultPattern(action.variant) }, false)
    case 'setTicketCount': {
      const ticketCount = Math.max(MIN_TICKETS, Math.min(MAX_TICKETS, Math.round(action.value)))
      return freshRound({ ...state, ticketCount, pattern: state.variant === 'tombola' ? 'ambo' : state.pattern }, false)
    }
    case 'setShowLetters': return { ...state, showLetters: action.value }
    case 'nextPrize': {
      if (state.variant !== 'tombola' || !state.winners.length) return state
      const pattern = nextTombolaPattern(state.pattern)
      if (!pattern) return freshRound({ ...state, pattern: 'ambo' })
      const next = { ...state, pattern, winners: [], modalOpen: false, players: state.players.map((p) => ({ ...p, won: [] })) }
      return settle(next, next.players)
    }
    case 'newRound': return freshRound(state.variant === 'tombola' ? { ...state, pattern: 'ambo' } : state)
    case 'resetScores': return { ...state, players: state.players.map((p) => ({ ...p, wins: 0 })) }
    case 'setAutoDraw': return { ...state, autoDraw: action.value }
    case 'setAutoDaub': return { ...state, autoDaub: action.value }
    case 'speed': return { ...state, speed: action.value }
    case 'closeModal': return { ...state, modalOpen: false }
  }
}

/** Portable ticket claim used in printouts/QRs. It contains no personal data. */
export function encodeTicketClaim(ticket: Ticket, variant: Variant): string { return `BP1.${variant}.${ticket.grid.map((c) => c.value).join('.')}` }
export function verifyTicketClaim(code: string, drawn: number[], pattern: Pattern, issued?: Ticket[]): { valid: boolean; variant?: Variant; reason: 'valid' | 'invalid' | 'not-won' } {
  const parts = code.trim().split('.')
  if (parts[0] !== 'BP1' || !(['75', '90', 'tombola'] as string[]).includes(parts[1])) return { valid: false, reason: 'invalid' }
  const variant = parts[1] as Variant; const values = parts.slice(2).map(Number); const expected = variant === '75' ? 25 : 27
  if (values.length !== expected || values.some((n) => !Number.isInteger(n) || n < BLANK || n > maxBall(variant))) return { valid: false, reason: 'invalid' }
  if (issued && !issued.some((ticket) => encodeTicketClaim(ticket, variant) === code.trim())) return { valid: false, reason: 'invalid' }
  const called = new Set(drawn)
  const grid = values.map((value) => ({ value, marked: value === FREE || value === BLANK || called.has(value) }))
  const applicable = patternsFor(variant).includes(pattern) ? pattern : defaultPattern(variant)
  const valid = ticketHasWon(grid, applicable, variant)
  return { valid, variant, reason: valid ? 'valid' : 'not-won' }
}
