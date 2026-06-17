'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { DualRunner, type EquityPoint, type MidPoint } from '../lib/sim/runner'
import { makeTape, mulberry32, type Fill } from '../lib/sim/tape'
import type { Side } from '../lib/hedge/ledger'
import MetricTiles from '../components/MetricTiles'
import Controls from '../components/Controls'

// Charts touch the DOM; skip SSR to avoid hydration/window issues.
const EquityContrastChart = dynamic(() => import('../components/EquityContrastChart'), {
  ssr: false,
})
const EquityVsMidChart = dynamic(() => import('../components/EquityVsMidChart'), { ssr: false })

const SPREAD = 0.02
const SLIPPAGE = 0.005
const E_MAX = 1_000_000 // permissive: keep both demo lines continuous (E_max is proven in engine tests)
const SEED = 2026
const INITIAL_MID = 0.5

type Snapshot = {
  series: EquityPoint[]
  vsMid: MidPoint[]
  hedged: { netExposure: number; capitalDeployed: number; spreadCaptured: number }
  unhedged: { netExposure: number; capitalDeployed: number; spreadCaptured: number }
  equities: { hedged: number; unhedged: number }
  mid: number
}

function buildRunner() {
  return new DualRunner({ spread: SPREAD, slippage: SLIPPAGE, eMax: E_MAX }, INITIAL_MID)
}

function snapshotOf(r: DualRunner): Snapshot {
  return {
    series: [...r.equitySeries()],
    vsMid: r.equityVsMid(40),
    hedged: r.hedgedState(),
    unhedged: r.unhedgedState(),
    equities: r.currentEquities(),
    mid: r.currentMid(),
  }
}

const clampMid = (m: number) => Math.min(0.95, Math.max(0.05, m))

export default function Page() {
  const runnerRef = useRef<DualRunner>(buildRunner())
  const tapeRef = useRef<() => Fill>(makeTape(SEED, { buyProb: 0.62, sizes: [50, 100, 250] }))
  const midRngRef = useRef<() => number>(mulberry32(SEED ^ 0x9e3779b9))

  const [snap, setSnap] = useState<Snapshot>(() => snapshotOf(runnerRef.current))
  const [hedgingPrimary, setHedgingPrimary] = useState(true)
  const [liveMid, setLiveMid] = useState(false)
  const [liveErr, setLiveErr] = useState<string | null>(null)
  const [autoplay, setAutoplay] = useState(false)
  const [fillSize, setFillSize] = useState(100)

  const sync = useCallback(() => setSnap(snapshotOf(runnerRef.current)), [])

  const doFill = useCallback(
    (side: Side, size: number) => {
      runnerRef.current.step({ side, size, dt: 0 })
      sync()
    },
    [sync],
  )

  const setMid = useCallback(
    (m: number) => {
      runnerRef.current.setMid(clampMid(m))
      sync()
    },
    [sync],
  )

  const reset = useCallback(() => {
    runnerRef.current = buildRunner()
    tapeRef.current = makeTape(SEED, { buyProb: 0.62, sizes: [50, 100, 250] })
    midRngRef.current = mulberry32(SEED ^ 0x9e3779b9)
    setAutoplay(false)
    sync()
  }, [sync])

  // Auto-play: wander the mid (random walk) and pull fills from the seeded tape.
  useEffect(() => {
    if (!autoplay) return
    let timer: ReturnType<typeof setTimeout>
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const r = runnerRef.current
      if (!liveMid) {
        const drift = (midRngRef.current() - 0.5) * 0.04
        r.setMid(clampMid(r.currentMid() + drift))
      }
      const fill = tapeRef.current()
      r.step(fill)
      sync()
      const delay = Math.min(1200, Math.max(200, fill.dt))
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [autoplay, liveMid, sync])

  // Live mid: poll the read-only Polymarket proxy. Optional — failures leave manual mid intact.
  useEffect(() => {
    if (!liveMid) {
      setLiveErr(null)
      return
    }
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch('/api/mid')
        const data = await res.json()
        if (cancelled) return
        if (res.ok && typeof data.mid === 'number') {
          runnerRef.current.setMid(clampMid(data.mid))
          setLiveErr(null)
          sync()
        } else {
          setLiveErr(data.error ?? 'live mid unavailable')
        }
      } catch {
        if (!cancelled) setLiveErr('live mid request failed')
      }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [liveMid, sync])

  const primary = hedgingPrimary ? snap.hedged : snap.unhedged
  const primaryEquity = hedgingPrimary ? snap.equities.hedged : snap.equities.unhedged
  const gap = snap.equities.hedged - snap.equities.unhedged

  return (
    <div className="wrap">
      <div className="header">
        <div>
          <h1>Hula Pre-Hedge Engine</h1>
          <div className="sub">
            Riskless-principal market-making — mirror Polymarket, hedge every fill, keep the spread.
          </div>
        </div>
        <span className="sim-badge">SIM · no capital · no secrets</span>
      </div>

      <MetricTiles
        primary={primary}
        primaryEquity={primaryEquity}
        counterfactualExposure={snap.unhedged.netExposure}
        mid={snap.mid}
        hedgingPrimary={hedgingPrimary}
        liveMid={liveMid}
      />

      <div className="charts">
        <div className="card">
          <h2>Equity over the tape</h2>
          <p className="cardsub">
            Same fill flow into two engines. Hedged stays flat (= Σ locked margin); unhedged
            random-walks with the mid. The gap is {gap >= 0 ? '+' : ''}
            {gap.toFixed(2)} right now — that gap is the risk pre-hedging removes.
          </p>
          <div className="chart-box">
            <EquityContrastChart data={snap.series} />
          </div>
          <div className="legend">
            <span>
              <span className="swatch hedged" />
              Hedged
            </span>
            <span>
              <span className="swatch unhedged" />
              Unhedged (counterfactual)
            </span>
          </div>
        </div>

        <div className="card">
          <h2>Equity vs. mid</h2>
          <p className="cardsub">
            At current inventory, sweep the mid 0→1. equity(m) = cash + (hedgeNet − userNet)·m.
          </p>
          <div className="chart-box">
            <EquityVsMidChart data={snap.vsMid} />
          </div>
          <div className="legend">
            <span>
              <span className="swatch hedged" />
              flat (riskless)
            </span>
            <span>
              <span className="swatch unhedged" />
              sloped (exposed)
            </span>
          </div>
        </div>
      </div>

      <Controls
        hedgingPrimary={hedgingPrimary}
        onToggleHedging={setHedgingPrimary}
        mid={snap.mid}
        onMid={setMid}
        liveMid={liveMid}
        onToggleLiveMid={setLiveMid}
        fillSize={fillSize}
        onFillSize={setFillSize}
        onBuy={() => doFill('buy', fillSize)}
        onSell={() => doFill('sell', fillSize)}
        autoplay={autoplay}
        onToggleAutoplay={() => setAutoplay((a) => !a)}
        onReset={reset}
      />
      {liveErr && (
        <p className="sub" style={{ marginTop: 8, color: 'var(--amber)' }}>
          Live mid: {liveErr} — set POLY_TOKEN_ID to enable. Manual mid still active.
        </p>
      )}
    </div>
  )
}
