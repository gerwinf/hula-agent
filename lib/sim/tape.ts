/**
 * Pre-hedge engine — seeded Poisson fill generator (SIM). Framework-free, zero IO.
 * Emits a reproducible stream of user fills: each fill carries a side, a size, and an
 * exponential inter-arrival delay `dt` (ms) — i.e. a Poisson arrival process. Seeded so
 * the demo replays identically; the UI timer turns `dt` into wall-clock cadence.
 */
import type { Side } from '../hedge/ledger'

export type Fill = { side: Side; size: number; dt: number }

export type TapeOptions = {
  ratePerSec?: number // mean arrivals/sec (Poisson rate), default 1
  buyProb?: number // P(buy), default 0.5
  sizes?: number[] // discrete size choices (uniform), default [100]
}

/** mulberry32 — small deterministic PRNG returning a float in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build a reproducible fill generator. Call the returned fn to pull the next fill. */
export function makeTape(seed: number, opts: TapeOptions = {}): () => Fill {
  const rng = mulberry32(seed)
  const rate = opts.ratePerSec ?? 1
  const buyProb = opts.buyProb ?? 0.5
  const sizes = opts.sizes ?? [100]
  return (): Fill => {
    const side: Side = rng() < buyProb ? 'buy' : 'sell'
    const size = sizes[Math.floor(rng() * sizes.length)]
    const u = 1 - rng() // in (0,1] so log is finite
    const dt = (-Math.log(u) / rate) * 1000
    return { side, size, dt }
  }
}
