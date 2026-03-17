import Link from 'next/link'
import type { BlogPost } from '@/lib/blog'
import BlogFeaturedImage from './BlogFeaturedImage'

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[1200/630] overflow-hidden">
        <BlogFeaturedImage title={post.title} alt={post.featuredImageAlt} />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.categories.map(cat => (
            <span key={cat} className="text-xs font-semibold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">
              {cat}
            </span>
          ))}
        </div>
        <h2 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition mb-2 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </time>
          <span>{post.readTime}</span>
        </div>
      </div>
    </Link>
  )
}
