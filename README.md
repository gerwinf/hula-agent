# Hula v0 Agent

Market-making agent for [Hula](https://hula.ph), a Philippine prediction market platform. Provides continuous two-sided liquidity for binary YES/NO sports contracts, with prices anchored to Polymarket as the upstream reference venue.

**Philosophy: mirror, don't discover.** Polymarket discovers price; Hula quotes a peso-denominated derivative with a controlled spread.

## Markets

- **NBA Finals 2026** (Jun 4 – Jun 22): per-game moneylines, series outrights
- **FIFA World Cup 2026** (Jun 11 – Jul 19): per-match outcomes, draws, tournament outrights

## How It Works

1. Fetches reference prices from Polymarket CLOB API every 30 seconds
2. Converts probability to PHP: `hula_price = polymarket_probability × 100` (e.g. $0.62 → ₱62)
3. Quotes ±₱1 spread around mid (widens to ±₱2 under low liquidity or in-event conditions)
4. Skews quotes to mean-revert inventory when net exposure exceeds ₱5,000 per market
5. Halts and notifies operator on resolution, reference loss, position limit breach, or toxic flow

## Tech Stack

- **Language**: Python
- **Tooling**: [`prediction-market-agent-tooling`](https://github.com/gnosis/prediction-market-agent-tooling) (Gnosis)
- **Settlement**: Polygon (USDC.e)
- **Resolution**: UMA via Polymarket mirror
- **Display currency**: USDC.e shown as PHP (₱)
- **LLM**: Claude Sonnet 4.6 (news interpretation, operator queries)
- **Operator interface**: Telegram bot

## Position Limits

| Scope | Limit |
|---|---|
| Per market | ₱20,000 |
| Per game/match | ₱50,000 |
| Per event-day | ₱200,000 |
| Total platform | ₱500,000 |

## Operator Commands

| Command | Effect |
|---|---|
| `/status` | Current quotes, inventory, P&L |
| `/pause [market_id]` | Pause quoting, keep positions |
| `/halt [market_id]` | Hard halt + cancel all orders |
| `/resume [market_id]` | Resume (requires confirmation) |
| `/spread [market_id] [value]` | Override spread |
| `/exposure [market_id] [limit]` | Override position limit |
| `/why [market_id]` | LLM explanation of last halt |
| `/killall` | Emergency halt all markets |

## Setup

```bash
git clone git@github.com:gerwinf/hula-agent.git
cd hula-agent
cp .env.example .env
# configure POLYMARKET_API_KEY, POLYGON_RPC_URL, TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY
pip install -e .
python -m hula.agent
```

## Status

v0 — NBA Finals + FIFA World Cup 2026. Not for production without operator supervision.
