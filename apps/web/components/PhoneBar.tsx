'use client'

export default function PhoneBar() {
  return (
    <div className="bg-[#1a1a2e] text-white py-2 z-[60] relative">
      <div className="container mx-auto px-4 flex items-center justify-between text-sm">
        <a href="tel:+16094568188" onClick={() => { if (typeof window !== 'undefined' && (window as any).clarity) (window as any).clarity('set', 'phone_clicked', 'true'); }} className="font-bold hover:text-teal-300 transition flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Call or Text: (609) 456-8188
        </a>
        <span className="hidden sm:inline text-gray-300 text-xs">
          Same-Day Pickup Available — Book Before Noon
        </span>
      </div>
    </div>
  )
}
