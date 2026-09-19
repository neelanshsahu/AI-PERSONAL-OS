/**
 * Analytics Page — Phase 11: Real Data Integration
 */

import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, MessageSquare,
  BookOpen, Image as ImageIcon, CalendarDays, Users, Clock,
  Activity, Zap, DollarSign, Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { api } from '@/services/api'
import { MetricCard } from '@/components/ui/MetricCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Constants ─────────────────────────────────────────────────────────────────

// Color maps and MetricCard removed in favor of shared component

const FEATURE_COLORS = {
  'chat': 'bg-brand-500',
  'rag': 'bg-accent-500',
  'agents': 'bg-amber-500',
  'images': 'bg-emerald-500',
  'unknown': 'bg-slate-600'
}

function timeAgo(iso) {
  if (!iso) return 'Just now'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

function BarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 w-full border-2 border-dashed border-white/[0.05] rounded-xl">
      <span className="text-xs text-slate-600">No chart data available</span>
    </div>
  )

  // Ensure we always show 7 days ending today
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const filledData = last7Days.map((dateStr) => {
    const existing = data.find(d => d.date === dateStr)
    return existing || { date: dateStr, requests: 0 }
  })

  const maxVal = Math.max(...filledData.map((d) => d.requests), 1)
  
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {filledData.map(({ date, requests }) => {
        const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        return (
          <div key={date} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end group relative">
            <span className="text-[10px] text-slate-600">{requests}</span>
            <div
              className={cn(
                'w-full rounded-t-lg transition-all duration-500',
                'bg-gradient-to-t from-brand-600 to-brand-400',
                'hover:from-brand-500 hover:to-accent-400',
              )}
              style={{ height: `${(requests / maxVal) * 80}%`, minHeight: '4px' }}
            />
            <span className="text-[10px] text-slate-600">{dayLabel}</span>
            
            {/* Tooltip */}
            <div className="absolute -top-8 bg-background border border-white/[0.1] px-2 py-1 rounded text-[10px] text-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {date}: {requests} req
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Analytics Page ────────────────────────────────────────────────────────────

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [recentSessions, setRecentSessions] = useState([])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [sumRes, chartRes, listRes] = await Promise.allSettled([
        api.get('/api/v1/usage/summary'),
        api.get('/api/v1/usage/chart?days=7'),
        api.get('/api/v1/usage/?limit=10'),
      ])

      if (sumRes.status   === 'fulfilled') setSummary(sumRes.value)
      if (chartRes.status === 'fulfilled') setChartData(chartRes.value || [])
      if (listRes.status  === 'fulfilled') setRecentSessions(listRes.value || [])

      // Log any errors for debugging
      ;[sumRes, chartRes, listRes].forEach((r, i) => {
        if (r.status === 'rejected') console.warn(`Analytics call ${i} failed:`, r.reason)
      })
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <Skeleton className="w-48 h-8 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  const features = summary?.by_feature || {}
  const totalRequests = Object.values(features).reduce((sum, s) => sum + (s.requests || 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-400" /> Analytics
          </h2>
          <p className="text-sm text-muted/60 mt-1">Live tracking of your AI platform usage.</p>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard label="Total Requests" value={summary?.total_requests || 0} icon={MessageSquare} color="brand" />
        <MetricCard label="Tokens Used" value={summary?.total_tokens?.toLocaleString() || 0} icon={Zap} color="accent" />
        <MetricCard label="Total Cost" value={`$${(summary?.total_cost_usd || 0).toFixed(4)}`} icon={DollarSign} color="amber" />
        <MetricCard label="Active Models" value={Object.keys(summary?.by_model || {}).length} icon={Activity} color="green" />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Queries per Day</h3>
              <p className="text-xs text-slate-600 mt-0.5">Last 7 days</p>
            </div>
            <Activity size={15} className="text-brand-400" />
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Feature Usage */}
        <div className="p-5 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-foreground">Most Used Tools</h3>
            <Users size={15} className="text-muted/60" />
          </div>
          <div className="space-y-4">
            {Object.keys(features).length === 0 ? (
              <p className="text-xs text-muted/60 text-center py-4">No tool usage recorded.</p>
            ) : (
              Object.entries(features)
                .sort((a, b) => b[1].requests - a[1].requests)
                .map(([feat, stats]) => {
                  const pct = totalRequests > 0 ? Math.round((stats.requests / totalRequests) * 100) : 0
                  const color = FEATURE_COLORS[feat] || FEATURE_COLORS.unknown
                  return (
                    <div key={feat}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted capitalize">{feat}</span>
                        <span className="text-muted/60 font-mono">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-overlay-white/[0.06] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Sessions Table ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-overlay-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-overlay-white/[0.06] bg-overlay-white/[0.02] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock size={14} className="text-muted/60" /> Recent Requests
          </h3>
          <span className="text-xs text-slate-600">{recentSessions.length} sessions shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Feature', 'Model', 'Tokens', 'Cost', 'Time'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted/60 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSessions.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-xs text-muted/60">No recent activity</td></tr>
              ) : (
                recentSessions.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.03] hover:bg-overlay-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-muted capitalize">{s.feature}</td>
                    <td className="px-5 py-3 text-xs text-muted/80">{s.model}</td>
                    <td className="px-5 py-3 text-xs text-muted/80 font-mono">{((s.tokens_in || 0) + (s.tokens_out || 0)).toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs text-emerald-400 font-mono">${s.cost_usd.toFixed(5)}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{timeAgo(s.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
