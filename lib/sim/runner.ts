/**
 * Pre-hedge engine — dual-engine SIM runner. Feeds ONE fill tape into TWO engines
 * (one hedging ON, one OFF) so the dashboard can draw both equity paths from identical
 * flow. The gap between the two equity series IS the pitch: hedged stays flat (= Σ locked
 * margin), unhedged random-walks with the mid.
 */
import { HedgeEngine, type EngineConfig } from '../hedge/engine'
import type { Fill } from './tape'

export type EquityPoint = { t: number; hedged: number; unhedged: number }
export type MidPoint = { mid: number; hedged: number; unhedged: number }

export class DualRunner {
  private hedged: HedgeEngine
  private unhedged: HedgeEngine
  private series: EquityPoint[] = []
  private t = 0
  private mid: number

  constructor(base: Omit<EngineConfig, 'hedging'>, mid: number) {
    this.hedged = new HedgeEngine({ ...base, hedging: true })
    this.unhedged = new HedgeEngine({ ...base, hedging: false })
    this.mid = mid
    this.record() // baseline point at t=0
  }

  setMid(mid: number) {
    this.mid = mid
  }

  /** Apply one fill to both engines at the current mid; advance the series. */
  step(fill: Fill): { hedged: boolean; unhedged: boolean } {
    const h = this.hedged.fill(fill.side, fill.size, this.mid)
    const u = this.unhedged.fill(fill.side, fill.size, this.mid)
    this.t += 1
    this.record()
    return { hedged: h.ok, unhedged: u.ok }
  }

  private record() {
    this.series.push({
      t: this.t,
      hedged: this.hedged.equityAt(this.mid),
      unhedged: this.unhedged.equityAt(this.mid),
    })
  }

  /** Equity over the tape so far (the hero chart). */
  equitySeries(): EquityPoint[] {
    return this.series
  }

  /** Sweep the mid 0→1 at current inventory (the proof chart): hedged flat, unhedged sloped. */
  equityVsMid(steps = 50): MidPoint[] {
    const out: MidPoint[] = []
    for (let i = 0; i <= steps; i++) {
      const m = i / steps
      out.push({ mid: m, hedged: this.hedged.equityAt(m), unhedged: this.unhedged.equityAt(m) })
    }
    return out
  }

  /** Live snapshot for the metric tiles, per engine. */
  hedgedState() {
    return this.hedged.state()
  }
  unhedgedState() {
    return this.unhedged.state()
  }
  currentMid() {
    return this.mid
  }

  /** Both engines' equity at the current mid (for the metric tiles). */
  currentEquities(): { hedged: number; unhedged: number } {
    return { hedged: this.hedged.equityAt(this.mid), unhedged: this.unhedged.equityAt(this.mid) }
  }
}
