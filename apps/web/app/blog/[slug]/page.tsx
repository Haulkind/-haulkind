import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import BlogFeaturedImage from '../components/BlogFeaturedImage'
import ShareButtons from '../components/ShareButtons'
import BlogCard from '../components/BlogCard'
import BlogContent from './BlogContent'

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found | HaulKind Blog' }
  return {
    title: `${post.title} | HaulKind Blog`,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://haulkind.com/blog/${post.slug}`,
      siteName: 'HaulKind',
      images: [{ url: post.featuredImage || '/og-image.png', width: 1200, height: 630, alt: post.featuredImageAlt }],
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage || '/og-image.png'],
    },
    alternates: {
      canonical: `https://haulkind.com/blog/${post.slug}`,
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const related = getRelatedPosts(params.slug, 3)
  const postUrl = `https://haulkind.com/blog/${post.slug}`

  // Extract H2 headings for Table of Contents
  const headingRegex = /^##\s+(.+)$/gm
  const headings: { text: string; id: string }[] = []
  let match
  while ((match = headingRegex.exec(post.content)) !== null) {
    const text = match[1].trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    headings.push({ text, id })
  }

  // Article JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: `https://haulkind.com${post.featuredImage || '/og-image.png'}`,
    author: { '@type': 'Organization', name: 'HaulKind', url: 'https://haulkind.com' },
    publisher: {
      '@type': 'Organization',
      name: 'HaulKind',
      logo: { '@type': 'ImageObject', url: 'https://haulkind.com/logo-full.svg' },
    },
    datePublished: post.date,
    dateModified: post.updated,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  }

  // FAQ JSON-LD — extract Q&A pairs from "Frequently Asked Questions" section
  const faqRegex = /\*\*(.+?)\*\*\n\n([\s\S]*?)(?=\n\n\*\*|\n\n---)/g
  const faqSection = post.content.split('## Frequently Asked Questions')[1] || ''
  const faqs: { question: string; answer: string }[] = []
  let faqMatch
  while ((faqMatch = faqRegex.exec(faqSection)) !== null) {
    faqs.push({ question: faqMatch[1].trim(), answer: faqMatch[2].trim() })
  }
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulkind.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://haulkind.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <article className="bg-gray-50 min-h-screen">
        {/* Featured image band */}
        <div className="w-full aspect-[1200/400] max-h-[400px] overflow-hidden">
          <BlogFeaturedImage title={post.title} alt={post.featuredImageAlt} />
        </div>

        <div className="container mx-auto px-4 max-w-4xl -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
            {/* Breadcrumbs */}
            <nav className="text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 flex-wrap">
                <li><Link href="/" className="hover:text-teal-600 transition">Home</Link></li>
                <li>/</li>
                <li><Link href="/blog" className="hover:text-teal-600 transition">Blog</Link></li>
                <li>/</li>
                <li className="text-gray-600 truncate max-w-[200px]">{post.title}</li>
              </ol>
            </nav>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map(cat => (
                <Link
                  key={cat}
                  href={`/blog?category=${encodeURIComponent(cat)}`}
                  className="text-xs font-semibold bg-teal-50 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-100 transition"
                >
                  {cat}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b">
              <span>{post.author}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{post.readTime}</span>
            </div>

            {/* Table of Contents */}
            {headings.length > 2 && (
              <div className="bg-gray-50 rounded-xl p-5 mb-8 border">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Table of Contents</h2>
                <ul className="space-y-2">
                  {headings.map(h => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="text-sm text-teal-600 hover:text-teal-800 transition">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blog content */}
            <BlogContent content={post.content} />

            {/* Share + tags */}
            <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <ShareButtons url={postUrl} title={post.title} />
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Author box */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border flex items-start gap-4">
              <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
                HK
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{post.author}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Fast, fair hauling & moving help in PA, NJ &amp; NY. Licensed &amp; insured, real-time GPS tracking, same-day service available.
                </p>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="mt-10 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to declutter?</h2>
              <p className="text-teal-100 mb-5">Get your free quote in 30 seconds — no hidden fees, no obligation.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/quote"
                  className="inline-block bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
                >
                  Get Your Instant Quote
                </Link>
                <a
                  href="tel:+16094568188"
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white transition font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call (609) 456-8188
                </a>
              </div>
              <p className="text-xs text-teal-200 mt-3">Half a truck starting at $279 — all-in pricing. Same-day pickup available.</p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="container mx-auto px-4 max-w-6xl py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Related Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map(p => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
