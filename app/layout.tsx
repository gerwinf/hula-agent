import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hula Pre-Hedge Engine — SIM',
  description: 'Riskless-principal market-making demo: hedged vs unhedged equity.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
