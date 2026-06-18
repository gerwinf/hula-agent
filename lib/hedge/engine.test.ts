import { describe, test, expect } from 'vitest'
import { HedgeEngine } from './engine'
import { lockedMargin } from './economics'

const CFG = { spread: 0.02, slippage: 0.005, eMax: 500, hedging: true }

describe('hedging ON', () => {
  test('every fill is offset → exposure ~0 and equity == Σ locked margin, flat across mids', () => {
    const e = new HedgeEngine(CFG)
    for (let i = 0; i < 10; i++) e.fill('buy', 100, 0.5)
    expect(e.state().netExposure).toBeCloseTo(0, 9)
    const expected = 10 * lockedMargin(100, 0.02, 0.005)
    expect(e.equityAt(0.5)).toBeCloseTo(expected, 6)
    expect(e.equityAt(0.9)).toBeCloseTo(expected, 6)
    expect(e.equityAt(0.1)).toBeCloseTo(expected, 6)
  })
})

describe('hedging OFF', () => {
  test('exposure accumulates and the E_max invariant rejects un-hedgeable flow', () => {
    const e = new HedgeEngine({ ...CFG, eMax: 250, hedging: false })
    expect(e.fill('buy', 100, 0.5).ok).toBe(true)
    expect(e.fill('buy', 100, 0.5).ok).toBe(true)
    const r3 = e.fill('buy', 100, 0.5)
    expect(r3.ok).toBe(false)
    if (!r3.ok) expect(r3.reason).toBe('e_max')
    expect(e.state().netExposure).toBeCloseTo(200, 9)
  })
  test('unhedged equity swings with the mid', () => {
    const e = new HedgeEngine({ ...CFG, hedging: false })
    e.fill('buy', 100, 0.5)
    const atFill = e.equityAt(0.5)
    expect(e.equityAt(0.9)).toBeLessThan(atFill)
    expect(e.equityAt(0.1)).toBeGreaterThan(atFill)
  })
})

describe('quote', () => {
  test('straddles the live mid by half the spread', () => {
    const e = new HedgeEngine(CFG)
    expect(e.quote(0.5)).toEqual({ bid: 0.49, ask: 0.51 })
  })
})
