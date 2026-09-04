import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SMORFIA } from './smorfia'

describe('family Smorfia', () => {
  it('has one labeled call and a bundled illustration for every number', () => {
    expect(SMORFIA).toHaveLength(90)
    expect(SMORFIA.map((call) => call.number)).toEqual(Array.from({ length: 90 }, (_, i) => i + 1))
    SMORFIA.forEach((call) => {
      expect(call.label.trim()).not.toBe('')
      expect(existsSync(`public/smorfia/${call.icon}.svg`), `missing artwork for ${call.number}`).toBe(true)
    })
  })
})
