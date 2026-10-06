import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Mattress Swap Help | HaulKind',
  description: 'Get an instant quote for mattress swap help: we carry the new mattress in and move the old one where you want it.',
  alternates: { canonical: '/quote/mattress-swap' },
}

export default function MattressSwapQuoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
