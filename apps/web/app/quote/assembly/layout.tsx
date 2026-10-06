import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Furniture Assembly | HaulKind',
  description: 'Get an instant quote for furniture assembly. Beds, desks, wardrobes and flat-pack furniture built at your home by insured pros.',
  alternates: { canonical: '/quote/assembly' },
}

export default function AssemblyQuoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
