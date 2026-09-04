import { describe, expect, it } from 'vitest'
import { BLANK, FREE, encodeTicketClaim, makeGame, makeGrid, maxBall, reduce, ticketHasWon, verifyTicketClaim } from './game'

describe('ticket generation', () => {
  it('makes valid 75-ball cards', () => {
    for (let sample = 0; sample < 100; sample++) {
      const grid = makeGrid('75')
      expect(grid).toHaveLength(25)
      expect(grid[12]).toEqual({ value: FREE, marked: true })
      for (let col = 0; col < 5; col++) {
        const values = Array.from({ length: 5 }, (_, row) => grid[row * 5 + col].value).filter(Boolean)
        expect(new Set(values).size).toBe(values.length)
        expect(values.every((n) => n >= col * 15 + 1 && n <= col * 15 + 15)).toBe(true)
      }
    }
  })

  it('makes valid 90-ball tickets', () => {
    for (let sample = 0; sample < 500; sample++) {
      const grid = makeGrid('90')
      expect(grid).toHaveLength(27)
      for (let row = 0; row < 3; row++) expect(grid.slice(row * 9, row * 9 + 9).filter((c) => c.value !== BLANK)).toHaveLength(5)
      for (let col = 0; col < 9; col++) {
        const values = Array.from({ length: 3 }, (_, row) => grid[row * 9 + col].value).filter((n) => n !== BLANK)
        expect(values.length).toBeGreaterThanOrEqual(1)
        expect(values).toEqual([...values].sort((a, b) => a - b))
        const low = col === 0 ? 1 : col * 10; const high = col === 8 ? 90 : col * 10 + 9
        expect(values.every((n) => n >= low && n <= high)).toBe(true)
      }
      const allNumbers = grid.filter((cell) => cell.value !== BLANK).map((cell) => cell.value)
      expect(new Set(allNumbers).size).toBe(15)
    }
  })

  it('applies one-line, two-line and full-house rules to one 90-ball ticket', () => {
    const grid = makeGrid('90')
    grid.slice(0, 9).forEach((cell) => { if (cell.value !== BLANK) cell.marked = true })
    expect(ticketHasWon(grid, 'oneLine', '90')).toBe(true)
    expect(ticketHasWon(grid, 'twoLines', '90')).toBe(false)
    grid.slice(9, 18).forEach((cell) => { if (cell.value !== BLANK) cell.marked = true })
    expect(ticketHasWon(grid, 'twoLines', '90')).toBe(true)
    expect(ticketHasWon(grid, 'fullHouse', '90')).toBe(false)
    grid.forEach((cell) => { if (cell.value !== BLANK) cell.marked = true })
    expect(ticketHasWon(grid, 'fullHouse', '90')).toBe(true)
  })
})

describe('authoritative reducer', () => {
  it('supports six tickets and rejects an uncalled forged daub', () => {
    let state = makeGame(['Ada'], [], 'line', '75', 6)
    expect(state.players[0].tickets).toHaveLength(6)
    const before = state.players[0].tickets[0].grid[0]
    state = reduce(state, { type: 'daub', player: 0, ticket: 0, cell: 0 })
    expect(state.players[0].tickets[0].grid[0]).toEqual(before)
  })

  it('marks a called number and auto-daubs across every ticket', () => {
    let state = makeGame(['Ada'], [], 'line', '75', 3)
    const number = state.players[0].tickets[0].grid.find((cell) => cell.value > 0)!.value
    state = { ...state, drawn: [number] }
    const cell = state.players[0].tickets[0].grid.findIndex((item) => item.value === number)
    state = reduce(state, { type: 'daub', player: 0, ticket: 0, cell })
    expect(state.players[0].tickets[0].grid[cell].marked).toBe(true)

    state = { ...makeGame(['Ada'], [], 'line', '90', 3), autoDaub: true, bag: [42] }
    state.players[0].tickets.forEach((ticket) => ticket.grid[0] = { value: 42, marked: false })
    state = reduce(state, { type: 'draw' })
    expect(state.players[0].tickets.every((ticket) => ticket.grid[0].marked)).toBe(true)
    expect(state.drawn).toEqual([42])
  })
})

describe('paper claim verification', () => {
  it('accepts an issued winning ticket and rejects a forged ticket', () => {
    const state = makeGame(['Ada'], [], 'oneLine', '90', 1)
    const ticket = state.players[0].tickets[0]
    const row = ticket.grid.slice(0, 9).filter((cell) => cell.value > 0).map((cell) => cell.value)
    expect(verifyTicketClaim(encodeTicketClaim(ticket, '90'), row, 'oneLine', [ticket]).valid).toBe(true)
    const forged = { ...ticket, grid: ticket.grid.map((cell, i) => i === 0 ? { value: maxBall('90'), marked: false } : cell) }
    expect(verifyTicketClaim(encodeTicketClaim(forged, '90'), row, 'oneLine', [ticket]).reason).toBe('invalid')
  })
})
