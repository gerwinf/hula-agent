/**
 * Read-only live-mid proxy. Calls the framework-free `fetchMid` against Polymarket's
 * public CLOB book and returns the mid. Reading the book needs no auth and works from
 * any region (only order-posting — M2 — needs an allowed-region host), so this route is
 * safe to run anywhere the dashboard is deployed.
 *
 * The dashboard treats this as optional: the manual mid slider is the default, so a dull
 * or missing live market never breaks the demo.
 */
import { fetchMid } from '../../../lib/hedge/poly-book'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tokenId = url.searchParams.get('token_id') ?? process.env.POLY_TOKEN_ID
  if (!tokenId) {
    return Response.json(
      { error: 'no token_id (pass ?token_id= or set POLY_TOKEN_ID)' },
      { status: 400 },
    )
  }
  const mid = await fetchMid(tokenId)
  if (mid == null) {
    return Response.json({ error: 'mid unavailable' }, { status: 502 })
  }
  return Response.json({ tokenId, mid })
}
