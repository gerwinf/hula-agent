/**
 * Pre-hedge engine — Polymarket read-only book connector (M0). Reads the live
 * CLOB order book for a YES token (no auth) and derives the mid. Read works from
 * any region; only order-posting (M2) needs an allowed-region host.
 */
const CLOB_URL = 'https://clob.polymarket.com'

export type BookLevel = { price: string | number; size: string | number }
export type Book = { bids: BookLevel[]; asks: BookLevel[] }

export function bestBidAsk(book: Book): { bid: number; ask: number } | null {
  if (!book.bids?.length || !book.asks?.length) return null
  const bid = Math.max(...book.bids.map((l) => Number(l.price)))
  const ask = Math.min(...book.asks.map((l) => Number(l.price)))
  if (!Number.isFinite(bid) || !Number.isFinite(ask)) return null
  return { bid, ask }
}

export function midFromBook(book: Book): number | null {
  const bba = bestBidAsk(book)
  return bba ? (bba.bid + bba.ask) / 2 : null
}

export async function fetchBook(tokenId: string, fetchImpl: typeof fetch = fetch): Promise<Book | null> {
  try {
    const res = await fetchImpl(`${CLOB_URL}/book?token_id=${encodeURIComponent(tokenId)}`)
    if (!res.ok) return null
    const raw = (await res.json()) as Partial<Book>
    if (!Array.isArray(raw.bids) || !Array.isArray(raw.asks)) return null
    return { bids: raw.bids, asks: raw.asks }
  } catch {
    return null
  }
}

export async function fetchMid(tokenId: string, fetchImpl: typeof fetch = fetch): Promise<number | null> {
  const book = await fetchBook(tokenId, fetchImpl)
  return book ? midFromBook(book) : null
}
