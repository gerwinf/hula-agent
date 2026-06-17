/**
 * Pre-hedge engine — SIM mode orchestration (M1). Ties economics + ledger:
 * quotes off the mid, processes user fills, simulates the offsetting Polymarket
 * fill at mid ± σ when hedging is ON. Hard invariant: net exposure may never
 * exceed E_max; a breaching fill is REJECTED. `pendingHedge` reservation (F1) is
 * modelled so the real engine (M2) inherits it.
 */
import { quotes } from './economics'
import {
  emptyLedger, applyUserFill, applyHedge, netExposure, equity,
  type LedgerState, type Side,
} from './ledger'

export type EngineConfig = { spread: number; slippage: number; eMax: number; hedging: boolean }
export type FillResult =
  | { ok: true; ledger: LedgerState; netExposure: number; hedged: boolean }
  | { ok: false; reason: 'e_max' }

export class HedgeEngine {
  private ledger = emptyLedger()
  private pendingHedge = 0
  private cfg: EngineConfig
  constructor(cfg: EngineConfig) { this.cfg = { ...cfg } }

  quote(mid: number) { return quotes(mid, this.cfg.spread) }
  setHedging(on: boolean) { this.cfg.hedging = on }

  fill(side: Side, size: number, mid: number): FillResult {
    const signed = side === 'buy' ? size : -size
    const projected = this.cfg.hedging
      ? netExposure(this.ledger)
      : netExposure(this.ledger) + signed
    if (Math.abs(projected) + this.pendingHedge > this.cfg.eMax) {
      return { ok: false, reason: 'e_max' }
    }
    const { bid, ask } = this.quote(mid)
    this.ledger = applyUserFill(this.ledger, side, size, side === 'buy' ? ask : bid, mid)
    let hedged = false
    if (this.cfg.hedging) {
      this.pendingHedge += size
      const polyPrice = side === 'buy' ? mid + this.cfg.slippage : mid - this.cfg.slippage
      this.ledger = applyHedge(this.ledger, side, size, polyPrice)
      this.pendingHedge -= size
      hedged = true
    }
    return { ok: true, ledger: this.ledger, netExposure: netExposure(this.ledger), hedged }
  }

  equityAt(mid: number): number { return equity(this.ledger, mid) }
  state() {
    return {
      ledger: this.ledger, netExposure: netExposure(this.ledger), pendingHedge: this.pendingHedge,
      spreadCaptured: this.ledger.spreadCaptured, capitalDeployed: this.ledger.capitalDeployed,
    }
  }
}
