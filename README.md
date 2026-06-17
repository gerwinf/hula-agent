# Hula Pre-Hedge Engine

The pre-hedge market-making engine for [Hula](https://hula.ph) — a bot that mirrors
Polymarket and **hedges every fill** (riskless principal). Hula quotes a two-sided market
off the Polymarket mid; every user fill is offset on Polymarket the instant it prints. Hula
keeps the spread, Polymarket carries the risk.

> **Why a separate repo:** at M2 this holds a Polygon hot-wallet private key and runs as an
> always-on worker in a geo-allowed region (NOT US/EU) trading real USDC. That must never live
> in or deploy alongside the consumer app. **The repo boundary IS the security + jurisdiction
> boundary.** The consumer Next.js app (landing, `/hits`, the virtual-currency fixed-odds bot)
> stays in `ph-prediction-market` — do not pull it in here.

## The economics (the whole business)

With Polymarket mid `m`, Hula spread `s`, hedge slippage `σ`, the locked margin per fill is
`N·(s/2 − σ)`. **Profitable iff `s/2 > σ`.** Pre-hedge kills *price* risk, not *capital* usage;
two-sided flow nets, which is what makes it capital-light.

**Ledger identity (the proof):** `equity(m) = cash + (hedgeNet − userNet)·m`. Fully hedged ⇒
`hedgeNet = userNet` ⇒ equity = cash = Σ locked margin (flat across any mid). Unhedged ⇒ equity
random-walks with `m`. The dashboard's **hedging on/off toggle visualizing this gap is the pitch.**

## Status

SIM core complete — **17 unit tests green, `tsc` clean**, zero capital, zero secrets.

| Module | What it is | Milestone |
|---|---|---|
| `lib/hedge/poly-book.ts` | Live Polymarket `/book` → mid (read-only, any region) | M0 |
| `lib/hedge/economics.ts` | Quotes, locked margin, the `s/2 > σ` profitability test | M1 |
| `lib/hedge/ledger.ts` | Risk/inventory ledger — exposure, capital, P&L, the equity identity | M1 |
| `lib/hedge/engine.ts` | SIM orchestration — hedging on/off, hard `E_max` invariant, `pendingHedge` reservation | M1 |

**Remaining:**
- **M0 finish** — dashboard (live mid + Hula quotes + exposure/capital/P&L-vs-spread + on/off toggle). The demoable M0/M1 artifact.
- **M2 real hedge** — flip SIM → real FAK orders via `@polymarket/clob-client-v2`; needs funded wallet + allowed-region host + jurisdiction sign-off, plus the F1 (concurrent reservation) / F2 (crash idempotency) fixes.
- **M3 ops/safety** — Telegram controls, kill switch, hedge-fail policy, `E_max` enforced live.
- **M4 user leg** — Privy embedded wallet + mock GCash + play-money for the end-to-end demo.

## Develop

```bash
npm i
npm test          # vitest run — expect 17 green
npx tsc --noEmit  # typecheck
```

The SIM core is framework-free TypeScript. Dashboard will be a small Next.js or Vite app.

## Polymarket facts (verified 2026-06)

- **Geo:** PH not blocked; US/UK/EU-core/AU blocked; SG/TH/TW close-only. Orders from blocked IPs are rejected — host the worker in an allowed region. Germany (founder location) is blocked; read-only works anywhere.
- **Client:** `@polymarket/clob-client-v2` (TS). Host `https://clob.polymarket.com`, chain 137.
- **Auth:** Polygon wallet key, EIP-712 L1 → derived L2 (HMAC) creds; every order signed.
- **Fees:** ~0 except 15-min crypto markets. Orders are limit; FAK to take. Each market exposes `minimum_order_size`.
- **Regulatory:** real-money prediction markets are NOT licensable in PH short-term (PAGCOR ordered Polymarket blocked). This engine is an investor/engine proof, NOT a PH consumer launch — hence SIM + tiny real hedge, and why the trading entity's jurisdiction is a counsel question.
