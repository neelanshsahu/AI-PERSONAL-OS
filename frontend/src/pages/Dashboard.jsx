/**
 * Dashboard — Phase 3 redesign.
 * Full overview with greeting, stats, quick actions, activity feed, and module cards.
 */

import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, BookOpen, CalendarDays, Sparkles,
  BarChart3, Settings, Zap, Activity, TrendingUp,
  FileText, Image, CheckSquare, ArrowRight, Clock,
  Cpu, Database, Wifi, Loader2
} from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_STATS = [
  { id: 'ai_queries_today',  label: 'AI Queries Today',   value: '0', icon: MessageSquare, change: '0', positive: true,  color: 'brand'  },
  { id: 'documents_indexed', label: 'Documents Indexed',  value: '0', icon: FileText,      change: '0', positive: true,  color: 'accent' },
  { id: 'tasks_due_today',   label: 'Tasks Due Today',    value: '0', icon: CheckSquare,   change: '0', positive: false, color: 'amber' },
  { id: 'images_generated',  label: 'Images Generated',   value: '0', icon: Image,         change: '0', positive: true,  color: 'green'  },
]

const QUICK_ACTIONS = [
  { to: '/chat',           icon: MessageSquare, label: 'New Chat',          desc: 'Start an AI conversation',    color: 'brand'  },
  { to: '/knowledge-base', icon: BookOpen,      label: 'Upload Document',   desc: 'Add to knowledge base',       color: 'accent' },
  { to: '/planner',        icon: CalendarDays,  label: 'Create Task',       desc: 'Add to your planner',         color: 'amber'  },
  { to: '/image-generator',icon: Sparkles,      label: 'Generate Image',    desc: 'Create AI artwork',           color: 'green'  },
]

const ACTIVITY = [
  { icon: MessageSquare, text: 'AI session started',          time: 'Just now',   color: 'text-brand-400'   },
  { icon: BookOpen,      text: '3 documents indexed',         time: '12 min ago', color: 'text-accent-400'  },
  { icon: CheckSquare,   text: 'Task "API review" completed', time: '1 hr ago',   color: 'text-emerald-400' },
  { icon: Sparkles,      text: '5 images generated',          time: '2 hr ago',   color: 'text-amber-400'   },
  { icon: BarChart3,     text: 'Weekly report ready',         time: 'Yesterday',  color: 'text-rose-400'    },
]

const MODULES = [
  { to: '/chat',           icon: MessageSquare, label: 'AI Chat',         desc: 'Chat with GPT-4 / Claude',              color: 'brand',  phase: null },
  { to: '/knowledge-base', icon: BookOpen,      label: 'Knowledge Base',  desc: 'RAG-powered document search',           color: 'accent', phase: null },
  { to: '/planner',        icon: CalendarDays,  label: 'AI Planner',      desc: 'Smart task & schedule management',       color: 'amber',  phase: null },
  { to: '/image-generator',icon: Sparkles,      label: 'Image Generator', desc: 'DALL·E / Stable Diffusion art',          color: 'green',  phase: null },
  { to: '/analytics',      icon: BarChart3,     label: 'Analytics',       desc: 'Usage metrics & cost insights',          color: 'rose',   phase: null },
  { to: '/settings',       icon: Settings,      label: 'Settings',        desc: 'API keys, appearance, preferences',      color: 'brand',  phase: null },
]

const SYSTEM = [
  { label: 'API Server',   status: 'online',   detail: 'FastAPI :8000',        icon: Wifi     },
  { label: 'Auth',         status: 'online',   detail: 'Supabase Auth',         icon: Cpu      },
  { label: 'Database',     status: 'online',   detail: 'Supabase Postgres',     icon: Database },
  { label: 'AI Services',  status: 'online',   detail: 'OpenAI gpt-4o',         icon: Zap      },
]

const colorMap = {
  brand:  { bg: 'bg-brand-500/10',   text: 'text-brand-400'  },
  accent: { bg: 'bg-accent-500/10',  text: 'text-accent-400' },
  green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400'},
  amber:  { bg: 'bg-amber-500/10',   text: 'text-amber-400'  },
  rose:   { bg: 'bg-rose-500/10',    text: 'text-rose-400'   },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QuickAction({ to, icon: Icon, label, desc, color }) {
  const navigate = useNavigate()
  const { bg, text } = colorMap[color] ?? colorMap.brand
  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        'group flex items-center gap-3 p-3 text-left w-full glass rounded-2xl',
        'hover:bg-white/[0.04] transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5',
      )}
    >
      <div className={cn('rounded-xl p-2.5 shrink-0', bg)}>
        <Icon size={18} className={text} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">{label}</p>
        <p className="text-xs text-slate-600 truncate">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-slate-700 group-hover:text-muted/80 transition-colors shrink-0 ml-auto" />
    </button>
  )
}

function ModuleCard({ to, icon: Icon, label, desc, color, phase }) {
  const navigate = useNavigate()
  const { bg, text } = colorMap[color] ?? colorMap.brand
  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        'group flex flex-col gap-3 p-5 text-left glass rounded-2xl',
        'hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10',
        phase && 'hover:shadow-glow-brand',
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', bg)}>
          <Icon size={20} className={text} />
        </div>
        {phase ? (
          <Badge variant="neutral" size="sm">Phase {phase}</Badge>
        ) : (
          <Badge variant="success" dot size="sm">Active</Badge>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="text-xs text-muted/60 mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-slate-600 group-hover:text-muted/80 transition-colors mt-auto">
        Open <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )
}

import { useState, useEffect } from 'react'

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, getAccessToken } = useAuth()
  const firstName = user?.email?.split('@')[0] ?? 'there'
  const greeting  = getGreeting()
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const [stats, setStats] = useState(INITIAL_STATS)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getAccessToken()
        const res = await fetch('http://localhost:8000/api/v1/profiles/me/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setStats((prev) => prev.map(s => ({
            ...s,
            value: data[s.id]?.toString() ?? '0'
          })))
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [getAccessToken])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-overlay-white/[0.08] bg-white dark:bg-[#0b0f19] p-6 lg:p-8 shadow-2xl">
        {/* Deep space glow effects (adapt to light mode) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full bg-accent-500/20 blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/80 to-white dark:via-[#0b0f19]/80 dark:to-[#0b0f19] pointer-events-none" />
        <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand" dot size="md">System Online</Badge>
              <span className="text-xs text-slate-600">{today}</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent capitalize">
                {firstName}
              </span> 👋
            </h2>
            <p className="text-muted/80 mt-1.5 text-sm max-w-lg leading-relaxed">
              Your AI Personal OS is running and ready. Explore the available modules below.
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 shadow-[0_0_30px_-5px_rgba(34,211,238,0.5)] animate-pulse-slow shrink-0 relative">
            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md mix-blend-overlay" />
            <Zap size={32} className="text-white relative z-10" />
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 relative">
        {loadingStats && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-3xl">
            <Loader2 className="animate-spin text-brand-400" size={24} />
          </div>
        )}
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Quick Actions + Activity ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick Actions */}
        <Card className="lg:col-span-2" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-brand-400" />
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => <QuickAction key={a.to} {...a} />)}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-accent-400" />
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {ACTIVITY.map(({ icon: Icon, text, time, color }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-lg bg-overlay-white/[0.04] flex items-center justify-center shrink-0">
                  <Icon size={12} className={color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted leading-snug">{text}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                    <Clock size={9} />{time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── System Status ────────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={15} className="text-muted/80" />
          <h3 className="text-sm font-semibold text-foreground">System Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SYSTEM.map(({ label, status, detail, icon: Icon }) => (
            <div key={label} className={cn(
              'flex flex-col gap-2 p-3 rounded-xl border',
              status === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/5 dark:border-emerald-500/15'
                : 'glass',
            )}>
              <div className="flex items-center justify-between">
                <Icon size={14} className={status === 'online' ? 'text-emerald-400' : 'text-slate-600'} />
                <Badge variant={status === 'online' ? 'success' : 'neutral'} dot size="sm">
                  {status === 'online' ? 'Online' : 'Pending'}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{label}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Feature Modules ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted/60 uppercase tracking-widest">Feature Modules</h2>
          <span className="text-xs text-slate-600">6 modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {MODULES.map((m) => <ModuleCard key={m.to} {...m} />)}
        </div>
      </section>

    </div>
  )
}
