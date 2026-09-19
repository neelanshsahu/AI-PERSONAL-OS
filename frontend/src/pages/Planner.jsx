/**
 * Planner Page — Phase 10 AI integration
 */

import { useState, useEffect } from 'react'
import {
  CalendarDays, Plus, CheckSquare, Square, Clock,
  Flag, Tag, MoreHorizontal, Filter, Search,
  ChevronRight, Circle, AlertCircle, Wand2, Loader2, Trash2
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { api } from '@/services/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_MAP = {
  high:   { color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   label: 'High'   },
  medium: { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  label: 'Medium' },
  low:    { color: 'text-muted/80',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  label: 'Low'    },
}

const FILTERS = ['All', 'Today', 'Upcoming', 'Completed']

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete, onUpdate }) {
  const p = PRIORITY_MAP[task.priority] || PRIORITY_MAP['medium']
  
  // Basic date formatting
  let dueText = 'No due date'
  let overdue = false
  if (task.due_date) {
    const due = new Date(task.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (due.getTime() === today.getTime()) dueText = 'Today'
    else if (due.getTime() < today.getTime()) {
      dueText = 'Overdue'
      overdue = true
    } else {
      dueText = due.toLocaleDateString()
    }
  }

  return (
    <div className={cn(
      'group flex items-start gap-3 p-4 rounded-2xl border',
      'transition-all duration-200',
      task.completed
        ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
        : overdue
          ? 'bg-rose-500/5 border-rose-500/15 hover:border-rose-500/25'
          : 'bg-overlay-white/[0.03] border-overlay-white/[0.06] hover:bg-overlay-white/[0.06] hover:border-overlay-white/[0.10]',
    )}>
      {/* Checkbox */}
      <button onClick={() => onToggle(task)} className="mt-0.5 shrink-0 text-slate-600 hover:text-brand-400 transition-colors">
        {task.completed
          ? <CheckSquare size={18} className="text-emerald-400" />
          : <Square size={18} />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn(
              'text-sm font-medium text-foreground leading-snug',
              task.completed && 'line-through text-slate-600',
            )}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted/60 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <button 
            onClick={() => onDelete(task.id)}
            className="text-slate-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {/* Due date */}
          <label className={cn(
            'flex items-center gap-1 text-[11px] cursor-pointer hover:text-foreground transition-colors relative',
            overdue && !task.completed ? 'text-rose-400' : 'text-slate-600',
          )}>
            {overdue && !task.completed ? <AlertCircle size={10} /> : <Clock size={10} />}
            {dueText}
            <input 
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={task.due_date || ''}
              onChange={(e) => onUpdate(task.id, { due_date: e.target.value })}
            />
          </label>

          {/* Priority */}
          <span className={cn('flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border', p.color, p.bg, p.border)}>
            <Flag size={9} /> {p.label}
          </span>

          {/* Tags */}
          {task.tags && task.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] text-slate-600">
              <Tag size={8} />{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Planner Page ──────────────────────────────────────────────────────────────

export default function Planner() {
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeFilter, setFilter] = useState('All')
  const [search, setSearch]       = useState('')
  
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiGoal, setAiGoal] = useState('')
  const [isSuggesting, setIsSuggesting] = useState(false)

  // Quick Add State
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await api.get('/api/v1/tasks/')
      setTasks(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const toggleTask = async (task) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    try {
      await api.put(`/api/v1/tasks/${task.id}`, { completed: !task.completed })
    } catch (err) {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t))
      alert('Failed to update task')
    }
  }

  const updateTask = async (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    try {
      await api.put(`/api/v1/tasks/${id}`, updates)
    } catch (err) {
      alert('Failed to update task')
    }
  }

  const deleteTask = async (id) => {
    if(!confirm("Delete this task?")) return
    try {
      await api.delete(`/api/v1/tasks/${id}`)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      const data = await api.post('/api/v1/tasks/', {
        title: newTaskTitle.trim(),
        priority: 'medium',
        due_date: newTaskDate || null
      })
      setTasks(prev => [data, ...prev])
      setNewTaskTitle('')
      setNewTaskDate('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAiSuggest = async () => {
    if (!aiGoal.trim() || isSuggesting) return
    setIsSuggesting(true)
    try {
      const newTasks = await api.post('/api/v1/tasks/suggest', { goal: aiGoal })
      setTasks(prev => [...newTasks, ...prev])
      setShowAiModal(false)
      setAiGoal('')
    } catch (err) {
      alert(`AI suggestion failed: ${err.message}`)
    } finally {
      setIsSuggesting(false)
    }
  }

  // Derived State
  const filtered = tasks.filter((t) => {
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    
    // Basic date logic for filters
    const todayStr = new Date().toISOString().split('T')[0]
    
    if (activeFilter === 'Today')     return t.due_date === todayStr && !t.completed
    if (activeFilter === 'Upcoming')  return (!t.due_date || t.due_date > todayStr) && !t.completed
    if (activeFilter === 'Completed') return t.completed
    return true
  })

  // Stats
  const total = tasks.length
  const todayDue = tasks.filter(t => t.due_date === new Date().toISOString().split('T')[0] && !t.completed).length
  const completed = tasks.filter(t => t.completed).length
  const overdue = tasks.filter(t => t.due_date && t.due_date < new Date().toISOString().split('T')[0] && !t.completed).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative pb-20">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays size={20} className="text-brand-400" /> Planner
          </h2>
          <p className="text-sm text-muted/60 mt-1">Manage daily tasks or let AI plan for you.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 transition-colors"
          >
            <Wand2 size={15} /> AI Suggest
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <span className="text-2xl font-bold text-brand-400">{total}</span>
          <span className="text-[11px] text-slate-600 text-center">Total Tasks</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <span className="text-2xl font-bold text-amber-400">{todayDue}</span>
          <span className="text-[11px] text-slate-600 text-center">Due Today</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <span className="text-2xl font-bold text-emerald-400">{completed}</span>
          <span className="text-[11px] text-slate-600 text-center">Completed</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <span className="text-2xl font-bold text-rose-400">{overdue}</span>
          <span className="text-[11px] text-slate-600 text-center">Overdue</span>
        </div>
      </div>

      {/* ── Quick Add ───────────────────────────────────────────────────── */}
      <form onSubmit={handleQuickAdd} className="relative flex items-center">
        <Plus size={16} className="absolute left-4 text-muted/60" />
        <input 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="w-full pl-11 pr-32 py-3 rounded-xl bg-overlay-white/[0.02] border border-overlay-white/[0.08] text-sm text-foreground focus:outline-none focus:border-brand-500/50 focus:bg-overlay-white/[0.04] transition-all"
        />
        <div className="absolute right-3 flex items-center gap-2">
          <label className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all relative",
            newTaskDate ? "bg-brand-500/20 text-brand-300 border border-brand-500/20" : "bg-overlay-white/[0.04] text-slate-500 hover:text-foreground border border-transparent hover:border-overlay-white/[0.08]"
          )}>
            <CalendarDays size={12} />
            {newTaskDate ? new Date(newTaskDate).toLocaleDateString() : 'Due date'}
            <input 
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
            />
          </label>
        </div>
      </form>

      {/* ── Search + Filter ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm',
              'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-muted placeholder:text-slate-600',
              'focus:outline-none focus:border-brand-500/40',
            )}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-overlay-white/[0.04] border border-overlay-white/[0.06]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                activeFilter === f
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20'
                  : 'text-muted/60 hover:text-muted',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Task List ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
          ))
        ) : (
          <EmptyState 
            icon={Circle} 
            title="No tasks found" 
            description="You're all caught up! Enjoy your free time or let AI suggest a new project for you."
          />
        )}
      </div>

      {/* ── AI Suggest Modal ────────────────────────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="w-full max-w-md bg-surface border border-overlay-white/[0.10] rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <Wand2 size={18} className="text-brand-400" /> Let AI plan it for you
            </h3>
            <p className="text-xs text-muted/80 mb-4">Enter a high-level goal and AI will break it down into actionable tasks.</p>
            
            <textarea
              value={aiGoal}
              onChange={(e) => setAiGoal(e.target.value)}
              placeholder="E.g. Plan a surprise birthday party for my friend this weekend..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-sm text-muted focus:outline-none focus:border-brand-500/50 resize-none mb-4"
            />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAiModal(false)} className="px-4 py-2 rounded-xl text-sm text-muted/80 hover:text-foreground transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleAiSuggest}
                disabled={!aiGoal.trim() || isSuggesting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-foreground disabled:opacity-50 transition-colors"
              >
                {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
                {isSuggesting ? 'Generating...' : 'Generate Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
