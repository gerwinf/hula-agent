import { describe, test, expect } from 'vitest'
import { emptyLedger, applyUserFill, applyHedge, netExposure, equity } from './ledger'

describe('hedged round-trip', () => {
  test('user buys YES, hedge buys YES on Poly → exposure 0, equity == locked margin', () => {
    const m = 0.5, s = 0.02, N = 100, sigma = 0.005
    let st = emptyLedger()
    st = applyUserFill(st, 'buy', N, m + s / 2, m)
    st = applyHedge(st, 'buy', N, m + sigma)
    expect(netExposure(st)).toBeCloseTo(0, 9)
    expect(equity(st, 0.5)).toBeCloseTo(0.5, 9)
    expect(equity(st, 0.9)).toBeCloseTo(0.5, 9)
    expect(equity(st, 0.1)).toBeCloseTo(0.5, 9)
  })
  test('spreadCaptured tracks the gross markup over mid', () => {
    const m = 0.5, s = 0.02, N = 100
    let st = applyUserFill(emptyLedger(), 'buy', N, m + s / 2, m)
    expect(st.spreadCaptured).toBeCloseTo(N * (s / 2), 9)
  })
})

describe('unhedged fill', () => {
  test('carries directional exposure; equity swings with the mid', () => {
    const m = 0.5, s = 0.02, N = 100
    const st = applyUserFill(emptyLedger(), 'buy', N, m + s / 2, m)
    expect(netExposure(st)).toBeCloseTo(N, 9)
    const atFill = equity(st, m)
    expect(equity(st, 0.9)).toBeLessThan(atFill)
    expect(equity(st, 0.1)).toBeGreaterThan(atFill)
  })
})

describe('capital', () => {
  test('hedge buy deploys capital; hedge sell frees it', () => {
    let st = emptyLedger()
    st = applyHedge(st, 'buy', 100, 0.5)
    expect(st.capitalDeployed).toBeCloseTo(50, 9)
    st = applyHedge(st, 'sell', 100, 0.5)
    expect(st.capitalDeployed).toBeCloseTo(0, 9)
  })
})
