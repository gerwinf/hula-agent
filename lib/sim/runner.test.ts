import { describe, test, expect } from 'vitest'
import { DualRunner } from './runner'
import { makeTape } from './tape'

const BASE = { spread: 0.02, slippage: 0.005, eMax: 1e9 }

describe('DualRunner — the contrast invariant', () => {
  test('same tape into both engines: hedged equity flat across mids, unhedged not', () => {
    const r = new DualRunner(BASE, 0.5)
    const next = makeTape(2026, { sizes: [100], buyProb: 0.7 })
    for (let i = 0; i < 30; i++) r.step(next())

    const sweep = r.equityVsMid(20)
    const hedgedVals = sweep.map((p) => p.hedged)
    // hedged equity is invariant to the mid → all sweep points equal
    for (const v of hedgedVals) expect(v).toBeCloseTo(hedgedVals[0], 6)
    // unhedged equity rides the mid → endpoints differ
    expect(sweep[0].unhedged).not.toBeCloseTo(sweep[sweep.length - 1].unhedged, 3)
  })

  test('hedged equity equals Σ locked margin (positive, flat)', () => {
    const r = new DualRunner(BASE, 0.5)
    const next = makeTape(7, { sizes: [100], buyProb: 0.5 })
    for (let i = 0; i < 50; i++) r.step(next())
    const eq = r.hedgedState()
    // every fill locks size·(s/2 − σ) = 100·(0.01 − 0.005) = 0.5, regardless of side
    expect(r.equitySeries().at(-1)!.hedged).toBeCloseTo(50 * 0.5, 6)
    expect(eq.netExposure).toBeCloseTo(0, 9)
  })

  test('series grows one point per step plus the baseline', () => {
    const r = new DualRunner(BASE, 0.5)
    const next = makeTape(1)
    for (let i = 0; i < 10; i++) r.step(next())
    expect(r.equitySeries().length).toBe(11)
  })

  test('unhedged engine can hit E_max and reject; hedged keeps going', () => {
    const r = new DualRunner({ spread: 0.02, slippage: 0.005, eMax: 250 }, 0.5)
    const buy = { side: 'buy' as const, size: 100, dt: 1 }
    expect(r.step(buy)).toEqual({ hedged: true, unhedged: true })
    expect(r.step(buy)).toEqual({ hedged: true, unhedged: true })
    // unhedged exposure would breach 250 → rejected; hedged nets to ~0 → fine
    expect(r.step(buy)).toEqual({ hedged: true, unhedged: false })
  })
})
