'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-teal-600 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xs tracking-tighter">HK</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-white">Haul</span>
                <span className="text-teal-400">Kind</span>
              </span>
            </Link>
            <p className="text-sm mb-4">
              Fast local junk removal with transparent pricing in Pennsylvania, New Jersey &amp; New York. No memberships. Track your driver live.
            </p>
            <a href="tel:+16094568188" className="text-teal-400 hover:text-teal-300 font-semibold text-sm transition">
              (609) 456-8188
            </a>
            {/* Social Media */}
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.facebook.com/gohaulkind" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition" aria-label="Facebook">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/haulkind/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition" aria-label="Instagram">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://x.com/gohaulkind" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-black rounded-full flex items-center justify-center transition" aria-label="X (Twitter)">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.youtube.com/@HaulKind" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition" aria-label="YouTube">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
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
              <li><Link href="/mattress-swap" className="hover:text-white transition">Mattress Swap</Link></li>
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
              <li><Link href="/become-a-driver" className="hover:text-white transition">Become a HaulKind Driver</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
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
            <Link href="/become-a-driver" className="text-primary-400 hover:text-white transition font-medium">HaulKind Driver Jobs</Link>
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
