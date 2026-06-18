import { describe, test, expect } from 'vitest'
import { mulberry32, makeTape } from './tape'

describe('mulberry32', () => {
  test('is deterministic for a given seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  test('returns values in [0,1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 100; i++) {
      const x = r()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('makeTape', () => {
  test('same seed → identical fill stream (reproducible demo)', () => {
    const a = makeTape(123)
    const b = makeTape(123)
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).toEqual(seqB)
  })
  test('different seeds diverge', () => {
    const a = makeTape(1)
    const b = makeTape(2)
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })
  test('emits valid sides, sizes from the configured set, and positive delays', () => {
    const next = makeTape(99, { sizes: [50, 100, 200], buyProb: 0.5, ratePerSec: 2 })
    for (let i = 0; i < 200; i++) {
      const f = next()
      expect(['buy', 'sell']).toContain(f.side)
      expect([50, 100, 200]).toContain(f.size)
      expect(f.dt).toBeGreaterThan(0)
    }
  })
  test('buyProb skews the side distribution', () => {
    const next = makeTape(5, { buyProb: 0.9 })
    let buys = 0
    const N = 1000
    for (let i = 0; i < N; i++) if (next().side === 'buy') buys++
    expect(buys / N).toBeGreaterThan(0.8)
  })
})
