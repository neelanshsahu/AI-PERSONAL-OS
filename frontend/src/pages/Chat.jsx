/**
 * Chat Page — Phase 5: Functional AI Chat
 *
 * Features:
 *  - Real conversation list from Supabase (via backend API)
 *  - Streaming responses via SSE (fetch + ReadableStream)
 *  - Markdown rendering (self-contained parser)
 *  - Typing cursor animation during streaming
 *  - Chat history persisted in Supabase
 *  - Auto-generated conversation titles
 *  - Auto-scroll on new messages
 *  - Auto-resize textarea
 *  - Model selector
 *  - New chat + delete chat
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, Plus, Search, Send, Bot, User,
  Trash2, MoreHorizontal, ChevronDown, Loader2,
  Zap, AlertCircle, Menu,
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

// ── Config ────────────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'gpt-4o',       label: 'GPT-4o',        badge: 'Best'    },
  { id: 'gpt-4o-mini',  label: 'GPT-4o Mini',   badge: 'Fast'    },
  { id: 'gpt-4-turbo',  label: 'GPT-4 Turbo',   badge: 'Capable' },
  { id: 'gpt-3.5-turbo',label: 'GPT-3.5 Turbo', badge: 'Legacy'  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Blinking typing cursor shown during streaming */
function TypingCursor() {
  return (
    <span
      className="inline-block w-0.5 h-3.5 bg-brand-400 rounded-full ml-0.5 align-middle"
      style={{ animation: 'blink 0.9s step-end infinite' }}
    />
  )
}

/** Single message bubble */
function MessageBubble({ role, content, isStreaming = false }) {
  const isUser = role === 'user'

  return (
    <div className={cn('group flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5',
        isUser
          ? 'bg-gradient-to-br from-brand-500 to-accent-500'
          : 'bg-overlay-white/[0.06] border border-overlay-white/[0.08]',
      )}>
        {isUser
          ? <User size={14} className="text-foreground" />
          : <Bot size={14} className="text-brand-400" />
        }
      </div>

      {/* Content */}
      <div className={cn('max-w-[78%] flex flex-col gap-1', isUser && 'items-end')}>
        <div className={cn(
          'px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-brand-600/70 text-foreground rounded-tr-sm text-sm leading-relaxed'
            : 'bg-white/[0.05] border border-white/[0.07] rounded-tl-sm',
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <MarkdownRenderer content={content} />
              {isStreaming && <TypingCursor />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Empty state when no conversation is selected */
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-6 animate-fade-in">
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow-brand">
        <Bot size={32} className="text-foreground" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-950 animate-pulse" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-bold text-foreground">AI Chat Ready</h3>
        <p className="text-sm text-muted/60 mt-1.5 max-w-xs leading-relaxed">
          Start a conversation or select one from the left panel.
        </p>
      </div>
      <button
        onClick={onNew}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
          'bg-brand-600 hover:bg-brand-500 text-foreground',
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-brand',
        )}
      >
        <Plus size={15} /> New Chat
      </button>
    </div>
  )
}

/** Conversation list item */
function ConvItem({ conv, active, onSelect, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border',
        active
          ? 'bg-brand-500/10 border-brand-500/20'
          : 'border-transparent hover:bg-overlay-white/[0.04] hover:border-overlay-white/[0.06]',
      )}
      onClick={() => onSelect(conv)}
    >
      <MessageSquare
        size={15}
        className={cn('shrink-0 mt-0.5', active ? 'text-brand-400' : 'text-slate-600')}
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', active ? 'text-foreground' : 'text-muted/80')}>
          {conv.title}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {conv.updated_at ? timeAgo(conv.updated_at) : '—'}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
        className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ── Main Chat Page ─────────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth()

  // Sidebar
  const [showSidebar, setShowSidebar] = useState(true)
  const [conversations, setConversations] = useState([])
  const [convLoading, setConvLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Active chat
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Streaming
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  // Input
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gpt-4o')

  // Refs
  const bottomRef    = useRef(null)
  const textareaRef  = useRef(null)
  const abortRef     = useRef(null)

  // ── Load conversations ────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setConvLoading(true)
    try {
      const data = await api.get('/api/v1/chat/?limit=50')
      setConversations(data ?? [])
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setConvLoading(false)
    }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // ── Select conversation ───────────────────────────────────────────────────

  const selectConversation = useCallback(async (conv) => {
    if (activeConv?.id === conv.id) return
    setActiveConv(conv)
    setMessages([])
    setStreamingContent('')
    setMessagesLoading(true)
    try {
      const data = await api.get(`/api/v1/chat/${conv.id}`)
      setMessages(data?.messages ?? [])
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [activeConv])

  // ── Create new chat ───────────────────────────────────────────────────────

  const createNewChat = useCallback(async () => {
    try {
      const newConv = await api.post('/api/v1/chat/', { title: 'New Chat', model })
      setConversations((prev) => [newConv, ...prev])
      setActiveConv(newConv)
      setMessages([])
      setStreamingContent('')
    } catch (err) {
      console.error('Failed to create chat:', err)
    }
  }, [model])

  // ── Delete chat ───────────────────────────────────────────────────────────

  const deleteConversation = useCallback(async (id) => {
    try {
      await api.delete(`/api/v1/chat/${id}`)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConv?.id === id) {
        setActiveConv(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }, [activeConv])

  // ── Send message (streaming) ──────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || isStreaming || !activeConv) return

    // Optimistically add user message
    const userMsg = { role: 'user', content, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const response = await api.stream(`/api/v1/chat/${activeConv.id}/send`, { content, model })

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer   = ''
      let full     = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))

            if (evt.type === 'chunk') {
              full += evt.content
              setStreamingContent(full)
            } else if (evt.type === 'done') {
              // Persist assistant message in local state
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: full, created_at: new Date().toISOString() },
              ])
              setStreamingContent('')

              // Update title in sidebar if auto-generated
              if (evt.title) {
                setConversations((prev) =>
                  prev.map((c) => c.id === activeConv.id ? { ...c, title: evt.title, updated_at: new Date().toISOString() } : c)
                )
                setActiveConv((prev) => prev ? { ...prev, title: evt.title } : prev)
              }
            } else if (evt.type === 'error') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `⚠️ Error: ${evt.message}`, created_at: new Date().toISOString(), error: true },
              ])
              setStreamingContent('')
            }
          } catch { /* skip malformed JSON */ }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Could not reach the AI server. Is the backend running?\n\n\`${err.message}\``, created_at: new Date().toISOString(), error: true },
      ])
      setStreamingContent('')
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, activeConv, model])

  // ── Keyboard submit ───────────────────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const adjustHeight = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }

  // ── Filtered conversations ────────────────────────────────────────────────

  const filtered = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(search.toLowerCase())
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Inline style for blink animation */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden">

        {/* ── Left: Sidebar ──────────────────────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r border-overlay-white/[0.06] bg-surface/40',
          'transition-all duration-300',
          showSidebar ? 'w-72 shrink-0' : 'w-0 overflow-hidden',
          'hidden md:flex',
        )}>
          {/* Header */}
          <div className="p-4 border-b border-overlay-white/[0.06] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
              <button
                id="new-chat-btn"
                onClick={createNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-foreground transition-colors"
              >
                <Plus size={13} /> New
              </button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-overlay-white/[0.04] border border-overlay-white/[0.06] text-muted/80 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {convLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="text-brand-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <MessageSquare size={24} className="text-slate-700" />
                <p className="text-xs text-slate-600">
                  {search ? 'No matches' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={activeConv?.id === conv.id}
                  onSelect={selectConversation}
                  onDelete={deleteConversation}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Chat Area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">

          {/* Chat header */}
          <div className="flex items-center justify-between px-4 lg:px-5 py-3.5 border-b border-overlay-white/[0.06] bg-surface/40 shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile: hamburger to open sidebar */}
              <button
                className="md:hidden text-muted/60 hover:text-muted transition-colors"
                onClick={() => setShowSidebar((v) => !v)}
              >
                <Menu size={18} />
              </button>

              <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                <Bot size={16} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">
                  {activeConv?.title ?? 'AI Chat'}
                </p>
                {activeConv && (
                  <p className="text-[10px] text-muted/60">{messages.length} messages</p>
                )}
              </div>
            </div>

            {/* Model selector */}
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] border border-overlay-white/[0.08] text-muted focus:outline-none focus:border-brand-500/40 cursor-pointer"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
            {!activeConv ? (
              <EmptyState onNew={createNewChat} />
            ) : messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={22} className="text-brand-400 animate-spin" />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 && !isStreaming && (
                  <div className="flex flex-col items-center gap-3 py-8 animate-fade-in">
                    <Zap size={24} className="text-brand-400" />
                    <p className="text-sm text-muted/60">Ask me anything — I'm ready.</p>
                  </div>
                )}

                {/* History */}
                {messages.map((msg, i) => (
                  <MessageBubble key={i} role={msg.role} content={msg.content} />
                ))}

                {/* Streaming assistant message */}
                {isStreaming && (
                  <MessageBubble
                    role="assistant"
                    content={streamingContent || ' '}
                    isStreaming
                  />
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-4 lg:px-6 py-4 border-t border-overlay-white/[0.06] bg-surface/30 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className={cn(
                'flex items-end gap-3 px-4 py-3 rounded-2xl',
                'bg-overlay-white/[0.04] border',
                'transition-all duration-200',
                activeConv ? 'border-overlay-white/[0.10] focus-within:border-brand-500/40' : 'border-overlay-white/[0.06] opacity-60',
              )}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); adjustHeight() }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeConv ? 'Message AI Personal OS… (Enter to send, Shift+Enter for new line)' : 'Select or create a conversation first'}
                  disabled={!activeConv || isStreaming}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-slate-600 outline-none resize-none max-h-[200px] disabled:cursor-not-allowed leading-relaxed"
                />
                <button
                  id="send-btn"
                  onClick={sendMessage}
                  disabled={!input.trim() || !activeConv || isStreaming}
                  className={cn(
                    'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
                    'transition-all duration-200',
                    input.trim() && activeConv && !isStreaming
                      ? 'bg-brand-600 hover:bg-brand-500 text-foreground hover:scale-105'
                      : 'bg-overlay-white/[0.06] text-slate-600 cursor-not-allowed',
                  )}
                >
                  {isStreaming
                    ? <Loader2 size={16} className="animate-spin text-brand-400" />
                    : <Send size={15} />
                  }
                </button>
              </div>
              <p className="text-[10px] text-slate-700 text-center mt-2">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
