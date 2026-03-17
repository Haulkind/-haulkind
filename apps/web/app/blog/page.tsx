import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getAllCategories } from '@/lib/blog'
import BlogCard from './components/BlogCard'

export const metadata: Metadata = {
  title: 'Blog — Tips, Guides & Local Resources | HaulKind',
  description: 'Junk removal tips, pricing guides, and local resources for PA, NJ & NY. Learn how to save on hauling, donate items, and declutter your home.',
  alternates: { canonical: 'https://haulkind.com/blog' },
  openGraph: {
    title: 'HaulKind Blog — Tips, Guides & Local Resources',
    description: 'Junk removal tips, pricing guides, and local resources for PA, NJ & NY.',
    url: 'https://haulkind.com/blog',
    siteName: 'HaulKind',
    type: 'website',
  },
}

export default function BlogIndexPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string }
}) {
  const allPosts = getAllPosts()
  const categories = getAllCategories()
  const activeCategory = searchParams.category || ''
  const currentPage = parseInt(searchParams.page || '1', 10)
  const postsPerPage = 6

  const filtered = activeCategory
    ? allPosts.filter(p => p.categories.includes(activeCategory))
    : allPosts

  const totalPages = Math.max(1, Math.ceil(filtered.length / postsPerPage))
  const page = Math.min(Math.max(1, currentPage), totalPages)
  const posts = filtered.slice((page - 1) * postsPerPage, page * postsPerPage)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1a1a2e] to-[#0d3b4f] text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">HaulKind Blog</h1>
          <p className="text-lg text-gray-300">
            Tips, Guides &amp; Local Resources for Junk Removal, Moving &amp; More
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !activeCategory ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            All
          </Link>
          {categories.map(cat => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === cat ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/blog?${activeCategory ? `category=${encodeURIComponent(activeCategory)}&` : ''}page=${p}`}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                  p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need junk removed?</h2>
          <p className="text-teal-100 mb-6 max-w-xl mx-auto">
            Get a guaranteed price in 30 seconds. No hidden fees, no obligation. Same-day pickup available.
          </p>
          <Link
            href="/quote"
            className="inline-block bg-white text-teal-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Get Your Free Quote
          </Link>
        </div>
      </div>
    </div>
  )
}
