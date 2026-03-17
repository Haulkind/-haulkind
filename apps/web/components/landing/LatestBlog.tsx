import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export default function LatestBlog() {
  const posts = getAllPosts().slice(0, 3)

  if (posts.length === 0) return null

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Latest from the Blog</h2>
          <p className="text-gray-600 mt-2">Tips, pricing guides &amp; local resources</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
            >
              <div className="w-full aspect-[1200/630] bg-gradient-to-br from-[#1a1a2e] via-[#0d3b4f] to-[#0D9488] flex flex-col items-center justify-center p-6 text-white">
                <svg className="w-10 h-10 mb-2 opacity-80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span className="text-sm font-bold text-center opacity-90">HaulKind</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.categories.map(cat => (
                    <span key={cat} className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </time>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/blog" className="text-teal-600 hover:text-teal-800 font-semibold transition">
            View All Posts &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
