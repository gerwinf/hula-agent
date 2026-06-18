# Pre-Hedge Engine — SIM Dashboard (M0/M1) Design

**Date:** 2026-06-17
**Status:** approved, building
**Scope:** the demoable SIM dashboard only. The real-money hedge bot (M2+) is explicitly out of scope and separately gated.

## Goal

A single page that makes the riskless-principal pitch land in one glance: two equity lines
diverging on the same fill tape (hedged stays flat, unhedged random-walks), plus the
equity-vs-mid proof curve. Audience: Stefan (technical advisor/angel) + the pre-seed round.
Zero capital, zero secrets — pure SIM.

## What is and isn't being built

**Already built (committed):** the framework-free SIM core in `lib/hedge/` — `economics`,
`ledger`, `engine`, read-only `poly-book`. In SIM mode `engine.ts` is the hedge bot's brain:
it quotes, processes fills, and simulates the offsetting Polymarket fill. It never sends a
real order.

**This spec adds (M0 finish):** the Next.js dashboard + the SIM glue it needs. Result: a
complete, clickable M0/M1 artifact.

**Out of scope (the real bot, M2+):** real FAK orders via `@polymarket/clob-client-v2`,
hot-wallet key, async hedge queue, F1/F2 fixes, Telegram/kill-switch (M3), Privy/user leg
(M4). M2 is hard-gated on a funded wallet, an allowed-region host, jurisdiction sign-off,
and the `clientOrderId` spike — it gets its own brainstorm → spec → plan cycle later.

## Architecture

- **Next.js App Router** app at repo root (`app/`), importing the SIM core from `lib/hedge/`
  unchanged. The SIM core stays pure (zero IO, framework-free).
- **The contrast trick:** run **two `HedgeEngine` instances on the same fill tape** — one
  `hedging: true`, one `hedging: false`. Every fill (manual or auto) is applied to *both*.
  The hedged engine's equity stays flat (= Σ locked margin); the unhedged one random-walks
  with the mid. That divergence is the hero chart — visible without touching the toggle.
- **The toggle** controls which engine is "primary" (highlighted in the metric tiles): ON
  shows the flat reality, OFF shows the exposure they'd be carrying. The counterfactual
  (ghost) line is always drawn for contrast.
- **State:** client-side React (`useReducer` over a `SimState`). No DB, no secrets, no
  capital.

## Components

- `app/page.tsx` — dashboard shell, contrast-first layout (metric tiles on top; hero +
  proof charts side by side; controls at the bottom).
- `app/api/mid/route.ts` — server route calling the existing `fetchMid(tokenId)` to proxy
  Polymarket (sidesteps browser CORS). Token chosen via `POLY_TOKEN_ID` env var.
- `components/MetricTiles.tsx` — Net Exposure, Capital Deployed, Spread Captured / P&L,
  Live Mid.
- `components/EquityContrastChart.tsx` — hero: hedged (solid green) vs unhedged (dashed red)
  equity over the tape.
- `components/EquityVsMidChart.tsx` — proof: sweep mid 0→1 at current inventory; flat green
  (hedged) vs sloped red (unhedged). Direct visual of `equity(m) = cash + (hedgeNet − userNet)·m`.
- `components/Controls.tsx` — hedging toggle, mid slider/input + "use live mid" checkbox
  (default OFF), Buy/Sell buttons (size presets), Auto-play start/stop, Reset.

## SIM glue (framework-free, unit-tested)

- `lib/sim/tape.ts` — a seeded **Poisson fill generator**: given a rate, a size distribution,
  and a seeded RNG, emits `{ side, size }` fills. Seeded so the demo is reproducible.
- `lib/sim/runner.ts` — drives both engines from one tape and accumulates the equity
  time-series the charts consume. Owns the "same tape → both engines" contract.

## Decisions

- **Charting:** Recharts. Declarative, reliable axes/tooltips, fine for ~1–2 ticks/sec.
  Swappable for hand-rolled SVG later if bundle size matters.
- **Live mid:** included now (the brief lists it in M0) but **default OFF**. The manual mid
  slider is the default so a dull live market can never break the pitch. The `/api/mid` route
  + "use live mid" checkbox are the opt-in.

## Testing

- vitest unit tests for `lib/sim/tape.ts` (seeded → deterministic output) and
  `lib/sim/runner.ts`.
- A dual-engine invariant test: same tape → hedged equity flat across mids, unhedged not.
- React components are demo surface, not unit-tested.
- The existing 17 core tests stay green.

## Out-of-scope guardrails

- No `@polymarket/clob-client-v2`, no `viem`, no wallet, no private keys in this repo yet.
- `/api/mid` is read-only and works from any region (read does not need an allowed-region host).
