import { describe, expect, it } from 'vitest'
import { allowedFromClient } from './lan'

describe('LAN action boundary', () => {
  it('requires a claimed seat even to draw', () => {
    expect(allowedFromClient({ type: 'draw' }, null)).toBe(false)
    expect(allowedFromClient({ type: 'draw' }, 0)).toBe(true)
  })

  it('allows players to change only their own card and name', () => {
    expect(allowedFromClient({ type: 'daub', player: 1, ticket: 2, cell: 3 }, 1)).toBe(true)
    expect(allowedFromClient({ type: 'daub', player: 0, ticket: 2, cell: 3 }, 1)).toBe(false)
    expect(allowedFromClient({ type: 'rename', player: 1, name: 'Ada' }, 1)).toBe(true)
    expect(allowedFromClient({ type: 'setVariant', variant: '90' }, 1)).toBe(false)
  })

  it('rejects malformed network payloads without throwing', () => {
    expect(allowedFromClient(null, 0)).toBe(false)
    expect(allowedFromClient({ type: 'rename', player: 0, name: 42 }, 0)).toBe(false)
    expect(allowedFromClient({ type: 'daub', player: 0, ticket: 'zero', cell: 2 }, 0)).toBe(false)
  })
})
