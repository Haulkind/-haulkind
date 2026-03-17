import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogPost {
  title: string
  slug: string
  date: string
  updated: string
  author: string
  excerpt: string
  featuredImage: string
  featuredImageAlt: string
  categories: string[]
  tags: string[]
  readTime: string
  schema: string
  content: string
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
  const posts = files.map(filename => {
    const filePath = path.join(POSTS_DIR, filename)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
      title: data.title || '',
      slug: data.slug || filename.replace(/\.mdx?$/, ''),
      date: data.date || '',
      updated: data.updated || data.date || '',
      author: data.author || 'HaulKind Team',
      excerpt: data.excerpt || '',
      featuredImage: data.featuredImage || '',
      featuredImageAlt: data.featuredImageAlt || '',
      categories: data.categories || [],
      tags: data.tags || [],
      readTime: data.readTime || '5 min read',
      schema: data.schema || 'Article',
      content,
    } as BlogPost
  })
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllPosts()
  return posts.find(p => p.slug === slug)
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(p => p.categories.includes(category))
}

export function getAllCategories(): string[] {
  const posts = getAllPosts()
  const cats = new Set<string>()
  posts.forEach(p => p.categories.forEach(c => cats.add(c)))
  return Array.from(cats).sort()
}

export function getAllSlugs(): string[] {
  return getAllPosts().map(p => p.slug)
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug)
  if (!current) return []
  const all = getAllPosts().filter(p => p.slug !== slug)
  const related = all.filter(p =>
    p.categories.some(c => current.categories.includes(c))
  )
  return related.length > 0 ? related.slice(0, limit) : all.slice(0, limit)
}
