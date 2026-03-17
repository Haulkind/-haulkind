'use client'

import { useMemo } from 'react'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/**
 * Renders markdown content as HTML with proper heading IDs for TOC anchoring.
 * Uses a lightweight markdown-to-HTML conversion (no heavy MDX runtime needed).
 */
export default function BlogContent({ content }: { content: string }) {
  const html = useMemo(() => markdownToHtml(content), [content])

  return (
    <div
      className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:text-teal-600 prose-a:font-medium hover:prose-a:text-teal-800 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-table:border prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-td:p-3 prose-td:border-t"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function markdownToHtml(md: string): string {
  let html = md

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[\s:|-]+\|)\n((?:\|.+\|\n?)*)/gm, (_match, header: string, _sep: string, body: string) => {
    const ths = header.split('|').filter(Boolean).map((c: string) => `<th>${c.trim()}</th>`).join('')
    const rows = body.trim().split('\n').map((row: string) => {
      const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('')
      return `<tr>${tds}</tr>`
    }).join('')
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`
  })

  // Headings
  html = html.replace(/^### (.+)$/gm, (_m, t: string) => `<h3 id="${slugify(t)}">${t}</h3>`)
  html = html.replace(/^## (.+)$/gm, (_m, t: string) => `<h2 id="${slugify(t)}">${t}</h2>`)

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Unordered lists
  html = html.replace(/^(?:- (.+)\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(line => `<li>${line.replace(/^- /, '')}</li>`).join('')
    return `<ul>${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/^(?:\d+\. (.+)\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`).join('')
    return `<ol>${items}</ol>`
  })

  // Paragraphs — wrap remaining loose lines
  html = html.replace(/^(?!<[a-z])((?!<).+)$/gm, '<p>$1</p>')

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}
