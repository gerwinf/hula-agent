'use client'

export default function Controls({
  hedgingPrimary,
  onToggleHedging,
  mid,
  onMid,
  liveMid,
  onToggleLiveMid,
  fillSize,
  onFillSize,
  onBuy,
  onSell,
  autoplay,
  onToggleAutoplay,
  onReset,
}: {
  hedgingPrimary: boolean
  onToggleHedging: (on: boolean) => void
  mid: number
  onMid: (m: number) => void
  liveMid: boolean
  onToggleLiveMid: (on: boolean) => void
  fillSize: number
  onFillSize: (n: number) => void
  onBuy: () => void
  onSell: () => void
  autoplay: boolean
  onToggleAutoplay: () => void
  onReset: () => void
}) {
  return (
    <div className="controls">
      <div className="control-group">
        <span className="label">Primary view</span>
        <div className="toggle" role="group" aria-label="hedging primary view">
          <button
            className={hedgingPrimary ? 'on' : ''}
            onClick={() => onToggleHedging(true)}
            aria-pressed={hedgingPrimary}
          >
            Hedging ON
          </button>
          <button
            className={!hedgingPrimary ? 'off-active' : ''}
            onClick={() => onToggleHedging(false)}
            aria-pressed={!hedgingPrimary}
          >
            OFF
          </button>
        </div>
      </div>

      <div className="control-group">
        <span className="label">Mid</span>
        <input
          type="range"
          min={0.02}
          max={0.98}
          step={0.005}
          value={mid}
          disabled={liveMid}
          onChange={(e) => onMid(Number(e.target.value))}
        />
        <span className="mid-readout">{mid.toFixed(3)}</span>
        <label className="checkbox">
          <span className={`live-dot ${liveMid ? 'on' : ''}`} />
          <input
            type="checkbox"
            checked={liveMid}
            onChange={(e) => onToggleLiveMid(e.target.checked)}
          />
          use live mid
        </label>
      </div>

      <div className="control-group">
        <span className="label">Size</span>
        <select
          value={fillSize}
          onChange={(e) => onFillSize(Number(e.target.value))}
          className="btn"
        >
          {[50, 100, 250, 500].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn buy" onClick={onBuy}>
          Buy
        </button>
        <button className="btn sell" onClick={onSell}>
          Sell
        </button>
      </div>

      <div className="control-group">
        <button className="btn play" onClick={onToggleAutoplay}>
          {autoplay ? '⏸ Pause' : '▶ Auto-play'}
        </button>
        <button className="btn" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  )
}
