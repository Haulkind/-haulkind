import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Donation Pickup Service | HaulKind - We Pick Up & Deliver to Charity',
  description: 'HaulKind picks up gently-used furniture, appliances, and household items and delivers them to local charities. Tax receipt available. Starting at $109.',
  openGraph: {
    title: 'Donation Pickup Service | HaulKind',
    description: 'We pick up your gently-used items and deliver them to local charities. Tax receipt available.',
    url: 'https://haulkind.com/donation-pickup',
  },
}

const donationItems = [
  { name: 'Furniture', icon: '🛋️', desc: 'Sofas, tables, chairs, dressers' },
  { name: 'Appliances', icon: '🧊', desc: 'Refrigerators, washers, dryers' },
  { name: 'Electronics', icon: '📺', desc: 'TVs, computers, monitors' },
  { name: 'Clothing', icon: '👕', desc: 'Bags, boxes of clothing' },
  { name: 'Sporting Goods', icon: '⚽', desc: 'Bikes, equipment, gear' },
  { name: 'Household Items', icon: '🏠', desc: 'Kitchen, decor, linens' },
]

const pricingTiers = [
  { name: 'Small Load', price: '$109', desc: '1-3 items (e.g., a chair + lamp)', size: '1/8 truck' },
  { name: 'Medium Load', price: '$169', desc: '4-6 items (e.g., sofa + table)', size: '1/4 truck' },
  { name: 'Large Load', price: '$279', desc: '7-12 items (e.g., bedroom set)', size: '1/2 truck' },
  { name: 'Full Load', price: '$389', desc: 'Full room or garage cleanout', size: 'Full truck' },
]

const faqs = [
  { q: 'What condition do items need to be in?', a: 'Items should be in usable condition - no major damage, stains, or missing parts. If unsure, send us a photo.' },
  { q: 'Do you provide a tax receipt?', a: 'Yes! We partner with local charities that provide official donation receipts for your tax records.' },
  { q: 'Which charities do you work with?', a: 'We work with Goodwill, Salvation Army, Habitat for Humanity ReStore, and other local Philadelphia-area nonprofits.' },
  { q: 'What happens to items that cannot be donated?', a: 'Items that do not meet donation standards are responsibly recycled or disposed of. We always try to donate first.' },
  { q: 'How quickly can you pick up?', a: 'Same-day pickup is available if you book before noon. Otherwise, next-day pickup is standard.' },
]

export default function DonationPickupPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            New Service
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Donation Pickup Service
          </h1>
          <p className="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto mb-8">
            We pick up your gently-used items and deliver them to local charities. Declutter your home AND help your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote?service=donation"
              className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition shadow-lg"
            >
              Schedule Donation Pickup
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <a
              href="tel:+16094568188"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition"
            >
              Call (609) 456-8188
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How Donation Pickup Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Tell Us What You Have', desc: 'Select items online or call us. Get an instant quote with no hidden fees.' },
              { step: '2', title: 'We Pick It Up', desc: 'Our crew comes to your home, loads everything, and handles all the heavy lifting.' },
              { step: '3', title: 'We Deliver to Charity', desc: 'Usable items go directly to a local charity. You get a donation receipt for your taxes.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Can Be Donated */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            What Can Be Donated?
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            If it is in good, usable condition, we can donate it
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {donationItems.map((item) => (
              <div key={item.name} className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Donation Partners */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Donation Partners</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            We work with trusted local and national charities to ensure your items help those in need
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-gray-500">
            <span className="text-xl font-semibold">Goodwill</span>
            <span className="text-xl font-semibold">Salvation Army</span>
            <span className="text-xl font-semibold">Habitat for Humanity</span>
            <span className="text-xl font-semibold">Local Nonprofits</span>
          </div>
        </div>
      </section>

      {/* Why Choose HaulKind */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose HaulKind for Donation Pickup
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { title: 'Tax Receipt Included', desc: 'Get an official donation receipt for your tax deduction.', icon: '📋' },
              { title: 'We Do the Heavy Lifting', desc: 'Our crew loads everything. You do not lift a finger.', icon: '💪' },
              { title: 'Same-Day Available', desc: 'Book before noon for same-day donation pickup.', icon: '⚡' },
              { title: 'Eco-Friendly', desc: 'Items go to charity, not the landfill. Feel good about decluttering.', icon: '🌱' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Donation Pickup Pricing</h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Transparent pricing - includes pickup, loading, and delivery to charity
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div key={tier.name} className="bg-white rounded-xl p-6 shadow-md text-center hover:shadow-lg transition">
                <h3 className="font-bold text-gray-900 mb-1">{tier.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{tier.size}</p>
                <p className="text-3xl font-bold text-teal-600 mb-3">{tier.price}</p>
                <p className="text-sm text-gray-600">{tier.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            All prices include labor, loading, transport, and charity delivery. No hidden fees.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-selling */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">Also Available</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/quote?service=haul-away" className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 hover:text-teal-600">{'Junk Removal \u2192'}</Link>
            <Link href="/assembly" className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 hover:text-teal-600">{'Furniture Assembly \u2192'}</Link>
            <Link href="/quote?service=labor-only" className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 hover:text-teal-600">{'Moving Labor \u2192'}</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Donate Your Items?</h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            Schedule your donation pickup today. Your items will help someone in need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote?service=donation"
              className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition shadow-lg"
            >
              Schedule Pickup Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <a
              href="tel:+16094568188"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition"
            >
              Call (609) 456-8188
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
