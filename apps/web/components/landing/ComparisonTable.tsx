import Link from 'next/link'

export default function ComparisonTable() {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How We Compare
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See why local homeowners and businesses choose HaulKind
          </p>
        </div>

        <div className="max-w-3xl mx-auto overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-md overflow-hidden">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left py-4 px-6 font-semibold">Feature</th>
                <th className="text-center py-4 px-6 font-semibold bg-teal-600">HaulKind</th>
                <th className="text-center py-4 px-6 font-semibold">Big National Chains</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { feature: 'Upfront Pricing', haulkind: true, chain: false, note: 'vs "we\'ll quote on-site"' },
                { feature: 'Real-Time GPS Tracking', haulkind: true, chain: false, note: '' },
                { feature: 'Same-Day Service', haulkind: true, chain: false, note: 'book before noon' },
                { feature: 'No Hidden Fees', haulkind: true, chain: false, note: 'all-in pricing, stairs, distance included' },
                { feature: 'Online Booking', haulkind: true, chain: true, note: '' },
                { feature: 'Licensed & Insured', haulkind: true, chain: true, note: '' },
                { feature: 'Donation Drop-Off', haulkind: true, chain: false, note: 'we donate usable items' },
                { feature: 'Furniture Assembly', haulkind: true, chain: false, note: 'assembly + haul-away combo' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-6 text-gray-800 font-medium text-sm">
                    {row.feature}
                    {row.note && <span className="block text-xs text-gray-400 mt-0.5">{row.note}</span>}
                  </td>
                  <td className="py-3 px-6 text-center bg-teal-50/50">
                    {row.haulkind ? (
                      <svg className="w-6 h-6 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {row.chain ? (
                      <svg className="w-6 h-6 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
          >
            Get Your Free Quote
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
