/**
 * MarkdownRenderer — Renders a markdown string using dangerouslySetInnerHTML.
 *
 * This is a self-contained parser that handles the common patterns returned
 * by GPT/Claude — no external dependencies required (works without react-markdown).
 *
 * Supported syntax:
 *  - **bold**, *italic*, `inline code`
 *  - ```code blocks``` with language hint
 *  - # H1, ## H2, ### H3
 *  - - / * unordered lists, 1. ordered lists
 *  - > blockquotes
 *  - --- horizontal rules
 *  - [links](url)
 *  - blank lines → paragraphs
 */

import { useMemo } from 'react'
import { cn } from '@/utils/cn'

// ── Parser ────────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseInline(text) {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-black/40 border border-white/10 font-mono text-xs text-brand-300 whitespace-nowrap">$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">$1</a>')
}

function parseMarkdown(md) {
  const lines = md.split('\n')
  const html = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'text'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]))
        i++
      }
      html.push(
        `<div class="my-3 rounded-xl overflow-hidden border border-overlay-white/[0.08]">` +
        `<div class="flex items-center justify-between px-4 py-1.5 bg-white/[0.05] border-b border-overlay-white/[0.06]">` +
        `<span class="text-[10px] font-mono text-muted/60 uppercase tracking-wider">${escapeHtml(lang)}</span>` +
        `</div>` +
        `<pre class="overflow-x-auto"><code class="block px-4 py-3 font-mono text-xs text-foreground leading-relaxed">${codeLines.join('\n')}</code></pre>` +
        `</div>`,
      )
      i++
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      html.push(`<h3 class="text-sm font-semibold text-foreground mt-4 mb-1.5">${parseInline(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      html.push(`<h2 class="text-base font-bold text-foreground mt-5 mb-2">${parseInline(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      html.push(`<h1 class="text-lg font-bold text-foreground mt-5 mb-2">${parseInline(line.slice(2))}</h1>`)
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      html.push(
        `<blockquote class="my-2 pl-3 border-l-2 border-brand-500/50 text-muted/80 italic text-sm">${parseInline(line.slice(2))}</blockquote>`,
      )
    }
    // Horizontal rule
    else if (line.match(/^-{3,}$|^\*{3,}$|^_{3,}$/)) {
      html.push('<hr class="my-4 border-overlay-white/[0.08]" />')
    }
    // Unordered list
    else if (line.match(/^[\*\-]\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^[\*\-]\s/)) {
        listItems.push(`<li class="ml-1">${parseInline(lines[i].replace(/^[\*\-]\s/, ''))}</li>`)
        i++
      }
      html.push(`<ul class="my-2 pl-4 space-y-1 list-disc text-sm text-foreground">${listItems.join('')}</ul>`)
      continue
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        listItems.push(`<li class="ml-1">${parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>`)
        i++
      }
      html.push(`<ol class="my-2 pl-4 space-y-1 list-decimal text-sm text-foreground">${listItems.join('')}</ol>`)
      continue
    }
    // Empty line
    else if (line.trim() === '') {
      html.push('<div class="h-1.5"></div>')
    }
    // Paragraph
    else {
      html.push(`<p class="text-sm text-foreground leading-relaxed">${parseInline(line)}</p>`)
    }

    i++
  }

  return html.join('\n')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MarkdownRenderer({ content, className }) {
  const html = useMemo(() => parseMarkdown(content || ''), [content])

  return (
    <div
      className={cn('markdown-body space-y-0.5', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
