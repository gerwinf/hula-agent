'use client'

export type EngineSnapshot = {
  netExposure: number
  capitalDeployed: number
  spreadCaptured: number
}

export default function MetricTiles({
  primary,
  primaryEquity,
  counterfactualExposure,
  mid,
  hedgingPrimary,
  liveMid,
}: {
  primary: EngineSnapshot
  primaryEquity: number
  counterfactualExposure: number
  mid: number
  hedgingPrimary: boolean
  liveMid: boolean
}) {
  const flat = Math.abs(primary.netExposure) < 1e-6
  return (
    <div className="tiles">
      <div className="tile">
        <div className="label">Net Exposure</div>
        <div className={`value ${flat ? 'green' : 'red'}`}>
          {primary.netExposure.toFixed(0)}
        </div>
        <div className="hint">
          {hedgingPrimary
            ? `unhedged would carry ${counterfactualExposure.toFixed(0)}`
            : 'directional — riding the mid'}
        </div>
      </div>

      <div className="tile">
        <div className="label">Capital Deployed</div>
        <div className="value">${primary.capitalDeployed.toFixed(2)}</div>
        <div className="hint">USDC tied up in hedges</div>
      </div>

      <div className="tile">
        <div className="label">{hedgingPrimary ? 'P&L (= Σ locked margin)' : 'P&L (mark-to-market)'}</div>
        <div className={`value ${primaryEquity >= 0 ? 'green' : 'red'}`}>
          ${primaryEquity.toFixed(2)}
        </div>
        <div className="hint">spread captured ${primary.spreadCaptured.toFixed(2)}</div>
      </div>

      <div className="tile">
        <div className="label">Mid {liveMid ? '(live)' : '(manual)'}</div>
        <div className="value">{mid.toFixed(3)}</div>
        <div className="hint">Polymarket reference</div>
      </div>
    </div>
  )
}
