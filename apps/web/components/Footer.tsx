'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <Link href="/" className="inline-block mb-2">
              <img src="/logo-full.svg" alt="HaulKind — Junk Removal & Hauling" className="h-8 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm mb-4">
              Fast local junk removal with transparent pricing in Pennsylvania, New Jersey &amp; New York. No memberships. Track your driver live.
            </p>
            <a href="tel:+16094568188" className="text-teal-400 hover:text-teal-300 font-semibold text-sm transition">
              (609) 456-8188
            </a>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services/furniture" className="hover:text-white transition">Furniture Removal</Link></li>
              <li><Link href="/services/appliances" className="hover:text-white transition">Appliance Removal</Link></li>
              <li><Link href="/services/cleanout" className="hover:text-white transition">Property Cleanouts</Link></li>
              <li><Link href="/services/commercial" className="hover:text-white transition">Commercial</Link></li>
              <li><Link href="/donation-pickup" className="hover:text-white transition">Donation Pickup</Link></li>
              <li><Link href="/assembly" className="hover:text-white transition">Furniture Assembly</Link></li>
              <li><Link href="/services/moving-labor" className="hover:text-white transition">Moving Labor</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
              <li><Link href="/service-areas" className="hover:text-white transition">Service Areas</Link></li>
              <li><Link href="/become-a-driver" className="hover:text-white transition">Become a Driver</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Popular Service Areas - SEO internal links */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <h4 className="text-white font-semibold mb-3 text-sm">Popular Service Areas</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link href="/junk-removal-philadelphia-pa" className="hover:text-white transition">Junk Removal Philadelphia</Link>
            <Link href="/furniture-removal-philadelphia-pa" className="hover:text-white transition">Furniture Removal Philadelphia</Link>
            <Link href="/junk-removal-camden-nj" className="hover:text-white transition">Junk Removal Camden NJ</Link>
            <Link href="/mattress-removal-cherry-hill-nj" className="hover:text-white transition">Mattress Removal Cherry Hill</Link>
            <Link href="/appliance-removal-trenton-nj" className="hover:text-white transition">Appliance Removal Trenton</Link>
            <Link href="/moving-help-princeton-nj" className="hover:text-white transition">Moving Help Princeton</Link>
            <Link href="/garage-cleanout-mount-laurel-nj" className="hover:text-white transition">Garage Cleanout Mount Laurel</Link>
            <Link href="/couch-removal-philadelphia-pa" className="hover:text-white transition">Couch Removal Philadelphia</Link>
            <Link href="/basement-cleanout-camden-nj" className="hover:text-white transition">Basement Cleanout Camden</Link>
            <Link href="/donation-pickup-cherry-hill-nj" className="hover:text-white transition">Donation Pickup Cherry Hill</Link>
            <Link href="/service-areas" className="text-primary-400 hover:text-white transition font-medium">View All Service Areas &rarr;</Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-6 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} HaulKind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
