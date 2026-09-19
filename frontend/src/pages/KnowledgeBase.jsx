/**
 * Knowledge Base Page — Phase 6: RAG Integration
 * - Fetches real documents from Supabase
 * - Handles PDF upload to RAG pipeline (/api/v1/rag/upload)
 * - RAG Chat Widget for semantic search and AI answers
 */

import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, Search, Upload, FileText, File,
  FileImage, Trash2, Download, Tag, Clock,
  Database, HardDrive, RefreshCw, Plus, Filter,
  MessageSquare, Loader2, Send, Bot, User, X, Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return 'Just now'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const FILE_ICONS = {
  pdf:   { icon: FileText, color: 'text-rose-400',   bg: 'bg-rose-500/10'   },
  md:    { icon: File,     color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  docx:  { icon: FileText, color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
  xlsx:  { icon: FileText, color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  image: { icon: FileImage,color: 'text-purple-400', bg: 'bg-purple-500/10' },
}

// ── Document Card ─────────────────────────────────────────────────────────────

function DocumentCard({ doc, onDelete }) {
  const ext = doc.file_type || (doc.name || '').split('.').pop().toLowerCase()
  const { icon: Icon, color, bg } = FILE_ICONS[ext] ?? FILE_ICONS.md
  
  return (
    <div className={cn(
      'group flex items-start gap-4 p-4 rounded-2xl border border-overlay-white/[0.06]',
      'bg-overlay-white/[0.03] hover:bg-overlay-white/[0.06] hover:border-overlay-white/[0.10]',
      'transition-all duration-200',
    )}>
      {/* Icon */}
      <div className={cn('rounded-xl p-3 shrink-0', bg)}>
        <Icon size={20} className={color} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
          <Badge
            variant={doc.status === 'indexed' ? 'success' : 'warning'}
            dot size="sm" className="shrink-0"
          >
            {doc.status === 'indexed' ? 'Indexed' : 'Processing'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
          <span>{formatBytes(doc.file_size)}</span>
          <span>·</span>
          <span>{doc.metadata?.pages || 1} pages</span>
          <span>·</span>
          <span>{doc.metadata?.chunks || 0} chunks</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock size={9} />{timeAgo(doc.created_at)}</span>
        </div>
        {/* Tags (mocked for now) */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-overlay-white/[0.08] text-[10px] text-muted/60">
            <Tag size={8} />{ext}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={async () => {
            try {
              const res = await api.get(`/api/v1/documents/${doc.id}/url`)
              if (res.url) window.open(res.url, '_blank')
            } catch (err) {
              console.error("Failed to fetch document URL:", err)
              alert("Could not open document. It may not have a storage file.")
            }
          }}
          className="w-7 h-7 rounded-lg bg-overlay-white/[0.06] flex items-center justify-center text-muted/60 hover:text-brand-400 transition-colors"
          title="View Original"
        >
          <Eye size={12} />
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="w-7 h-7 rounded-lg bg-overlay-white/[0.06] flex items-center justify-center text-muted/60 hover:text-rose-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── RAG Chat Widget ───────────────────────────────────────────────────────────

function RagChat({ onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || isStreaming) return

    const query = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setIsStreaming(true)

    try {
      const formData = new FormData()
      formData.append('query', query)

      const res = await api.streamForm('/api/v1/rag/chat', formData)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let citations = null
      let buffer = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '', citations: null }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() 

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'chunk') {
              full += evt.content
              setMessages(prev => {
                const arr = [...prev]
                arr[arr.length - 1].content = full
                return arr
              })
            } else if (evt.type === 'done') {
              citations = evt.citations
              setMessages(prev => {
                const arr = [...prev]
                arr[arr.length - 1].citations = citations
                return arr
              })
            } else if (evt.type === 'error') {
              full += `\n\n⚠️ Error: ${evt.message}`
              setMessages(prev => {
                const arr = [...prev]
                arr[arr.length - 1].content = full
                return arr
              })
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: `⚠️ Request failed: ${err.message}`, citations: null }
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[550px] bg-surface border border-overlay-white/[0.10] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-overlay-white/[0.06] bg-background">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
            <Bot size={16} className="text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Ask Knowledge Base</h3>
            <p className="text-[10px] text-muted/80">RAG Semantic Search</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted/60 hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <Database size={32} className="text-brand-400" />
            <p className="text-sm text-muted">Ask a question and I'll answer it based on your indexed documents.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col gap-1", m.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "px-3 py-2 rounded-xl max-w-[85%] text-sm",
              m.role === 'user' ? "bg-brand-600 text-foreground" : "bg-white/[0.05] border border-overlay-white/[0.06]"
            )}>
              {m.role === 'user' ? m.content : <MarkdownRenderer content={m.content} />}
            </div>
            {m.citations?.length > 0 && (
              <div className="mt-1 space-y-1">
                <p className="text-[10px] text-muted/60 font-semibold uppercase">Sources:</p>
                {m.citations.map((c, idx) => (
                  <div key={idx} className="px-2 py-1 bg-overlay-white/[0.02] border border-white/[0.04] rounded-md text-[10px] text-muted/80 max-w-[85%]">
                    <span className="text-brand-400 font-medium">Page {c.page}</span> — "{c.content_preview}"
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
           <span
             className="inline-block w-1.5 h-1.5 bg-brand-400 rounded-full ml-1"
             style={{ animation: 'blink 1s infinite' }}
           />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-overlay-white/[0.06] bg-background">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask about your documents..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-brand-600 text-foreground flex items-center justify-center disabled:opacity-50"
          >
            {isStreaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Knowledge Base Page ───────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  
  const fileInputRef = useRef(null)

  // 1. Fetch documents
  const fetchDocs = async () => {
    try {
      setLoading(true)
      const data = await api.get('/api/v1/documents/')
      setDocuments(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  // 2. Upload document
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.form('/api/v1/rag/upload', formData)
      await fetchDocs()
    } catch (err) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 3. Delete document
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await api.delete(`/api/v1/documents/${id}`)
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const filtered = documents.filter((d) =>
    (d.name || '').toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalSize = documents.reduce((acc, d) => acc + (d.file_size || 0), 0)
  const indexedCount = documents.filter(d => d.status === 'indexed').length

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in relative pb-20">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BookOpen size={20} className="text-brand-400" />
            Knowledge Base
          </h2>
          <p className="text-sm text-muted/60 mt-1">
            Upload PDF documents for RAG indexing and semantic search.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.05] border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 transition-all duration-200"
          >
            <MessageSquare size={15} /> Ask AI
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
              'bg-brand-600 hover:bg-brand-500 text-foreground',
              'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-brand',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
          >
            {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} 
            {isUploading ? 'Indexing...' : 'Add Document'}
          </button>
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <div className="rounded-xl p-2 bg-brand-500/10"><FileText size={16} className="text-brand-400" /></div>
          <div><p className="text-lg font-bold text-foreground leading-none">{documents.length}</p><p className="text-xs text-muted/60 mt-0.5">Documents</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <div className="rounded-xl p-2 bg-accent-500/10"><HardDrive size={16} className="text-accent-400" /></div>
          <div><p className="text-lg font-bold text-foreground leading-none">{formatBytes(totalSize)}</p><p className="text-xs text-muted/60 mt-0.5">Total Size</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <div className="rounded-xl p-2 bg-emerald-500/10"><Database size={16} className="text-emerald-400" /></div>
          <div><p className="text-lg font-bold text-foreground leading-none">{indexedCount}</p><p className="text-xs text-muted/60 mt-0.5">Indexed</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <div className="rounded-xl p-2 bg-amber-500/10"><RefreshCw size={16} className="text-amber-400" /></div>
          <div><p className="text-lg font-bold text-foreground leading-none">{documents.length > 0 ? timeAgo(documents[0].created_at) : 'Never'}</p><p className="text-xs text-muted/60 mt-0.5">Last Synced</p></div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search indexed documents..."
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm',
              'bg-overlay-white/[0.04] border border-overlay-white/[0.08]',
              'text-muted placeholder:text-slate-600',
              'focus:outline-none focus:border-brand-500/40',
              'transition-all duration-200',
            )}
          />
        </div>
      </div>

      {/* ── Document List ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
        ) : filtered.length > 0 ? (
          filtered.map((doc) => <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed border-white/[0.05] rounded-2xl">
            <BookOpen size={32} className="text-slate-700" />
            <p className="text-sm text-slate-600">No documents found.</p>
            <button onClick={() => fileInputRef.current?.click()} className="text-brand-400 text-sm font-medium hover:underline">Upload a PDF to get started</button>
          </div>
        )}
      </div>

      {showChat && <RagChat onClose={() => setShowChat(false)} />}
    </div>
  )
}
