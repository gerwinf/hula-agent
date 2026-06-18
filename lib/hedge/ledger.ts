/**
 * Pre-hedge engine — risk/inventory ledger. Pure accounting, zero IO; the single
 * source of truth for exposure, capital, and P&L.
 *
 *   userNet  = net YES the user side is long against Hula (user buy YES → +N).
 *   hedgeNet = net YES Hula holds on Polymarket as the offset    (hedge buy → +N).
 *   netExposure = userNet − hedgeNet  → 0 when every fill is hedged.
 *   equity(m)   = cash + (hedgeNet − userNet)·m
 */
export type Side = 'buy' | 'sell'

export type LedgerState = {
  cash: number
  userNet: number
  hedgeNet: number
  capitalDeployed: number
  spreadCaptured: number
}

export function emptyLedger(): LedgerState {
  return { cash: 0, userNet: 0, hedgeNet: 0, capitalDeployed: 0, spreadCaptured: 0 }
}

export function applyUserFill(
  s: LedgerState, side: Side, size: number, hulaPrice: number, mid: number,
): LedgerState {
  if (side === 'buy') {
    return { ...s, cash: s.cash + size * hulaPrice, userNet: s.userNet + size,
      spreadCaptured: s.spreadCaptured + size * (hulaPrice - mid) }
  }
  return { ...s, cash: s.cash - size * hulaPrice, userNet: s.userNet - size,
    spreadCaptured: s.spreadCaptured + size * (mid - hulaPrice) }
}

export function applyHedge(s: LedgerState, side: Side, size: number, polyPrice: number): LedgerState {
  if (side === 'buy') {
    return { ...s, cash: s.cash - size * polyPrice, hedgeNet: s.hedgeNet + size,
      capitalDeployed: s.capitalDeployed + size * polyPrice }
  }
  return { ...s, cash: s.cash + size * polyPrice, hedgeNet: s.hedgeNet - size,
    capitalDeployed: s.capitalDeployed - size * polyPrice }
}

export function netExposure(s: LedgerState): number { return s.userNet - s.hedgeNet }
export function equity(s: LedgerState, mid: number): number { return s.cash + (s.hedgeNet - s.userNet) * mid }
