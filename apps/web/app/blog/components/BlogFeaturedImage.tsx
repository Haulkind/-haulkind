// TODO: Replace with real photo of HaulKind truck on job
export default function BlogFeaturedImage({ title, alt }: { title: string; alt: string }) {
  return (
    <div
      className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#0d3b4f] to-[#0D9488] flex flex-col items-center justify-center p-8 text-white"
      role="img"
      aria-label={alt}
    >
      {/* Truck icon */}
      <svg className="w-16 h-16 mb-4 opacity-80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      <span className="text-lg font-bold text-center leading-tight max-w-xs opacity-90">
        HaulKind — Professional Junk Removal
      </span>
      <span className="text-xs mt-2 opacity-60 text-center max-w-sm line-clamp-2">{title}</span>
    </div>
  )
}
