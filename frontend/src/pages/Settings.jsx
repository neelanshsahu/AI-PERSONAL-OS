/**
 * Settings Page — Multi-section settings UI
 */

import { useState } from 'react'
import { useTheme } from '@/context/ThemeProvider'
import {
  Settings as SettingsIcon, User, Palette, Bell, Key, Shield,
  Camera, Mail, FileText, Save, Eye, EyeOff,
  Copy, Check, ChevronRight, Moon, Sun, Monitor,
  Sliders, Globe,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

// ── Sections ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'profile',      icon: User,        label: 'Profile'      },
  { id: 'appearance',   icon: Palette,     label: 'Appearance'   },
  { id: 'notifications',icon: Bell,        label: 'Notifications' },
  { id: 'api-keys',     icon: Key,         label: 'API Keys'     },
  { id: 'privacy',      icon: Shield,      label: 'Privacy'      },
]

const THEMES = [
  { id: 'dark',   icon: Moon,    label: 'Dark'   },
  { id: 'light',  icon: Sun,     label: 'Light'  },
  { id: 'system', icon: Monitor, label: 'System' },
]

const ACCENT_COLORS = [
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { id: 'cyan',   label: 'Cyan',   class: 'bg-cyan-500'   },
  { id: 'rose',   label: 'Rose',   class: 'bg-rose-500'   },
  { id: 'amber',  label: 'Amber',  class: 'bg-amber-500'  },
  { id: 'emerald',label: 'Emerald',class: 'bg-emerald-500'},
]

const API_KEYS = [
  { id: 'openai',     label: 'OpenAI',    value: 'sk-••••••••••••••••••••••••••••••••••••••••',   badge: 'GPT-4'   },
  { id: 'anthropic',  label: 'Anthropic', value: 'sk-ant-••••••••••••••••••••••••••••••••',        badge: 'Claude'  },
  { id: 'stability',  label: 'Stability', value: 'sk-••••••••••••••••••••••••••',                  badge: 'SDXL'    },
]

// ── UI Helpers ────────────────────────────────────────────────────────────────

function FormField({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  )
}

function TextInput({ placeholder, defaultValue, type = 'text', disabled }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      disabled={disabled}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl text-sm',
        'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-foreground placeholder:text-slate-600',
        'focus:outline-none focus:border-brand-500/40 transition-all',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    />
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-all duration-300',
          checked ? 'bg-brand-600' : 'bg-overlay-white/[0.10]',
        )}
      >
        <div className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300',
          checked ? 'left-6' : 'left-1',
        )} />
      </button>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4 mt-2">{children}</h3>
  )
}

// ── Section Content ────────────────────────────────────────────────────────────

function ProfileSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Profile</h2>
        <p className="text-sm text-muted/60 mt-1">Manage your personal information.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-foreground">
            U
          </div>
          <button className={cn(
            'absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl',
            'bg-surface border border-overlay-white/[0.10]',
            'flex items-center justify-center',
            'text-muted/80 hover:text-foreground transition-colors',
          )}>
            <Camera size={13} />
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Profile Picture</p>
          <p className="text-xs text-slate-600 mt-0.5">JPG, PNG or GIF. Max 5 MB.</p>
          <button className="text-xs text-brand-400 hover:text-brand-300 mt-2 transition-colors">Upload photo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Display Name">
          <TextInput placeholder="Your name" defaultValue="" />
        </FormField>
        <FormField label="Email" hint="Cannot be changed here — update via Supabase.">
          <TextInput placeholder="you@example.com" disabled />
        </FormField>
      </div>

      <FormField label="Bio" hint="Brief description about yourself.">
        <textarea
          placeholder="I'm building AI-powered tools…"
          rows={3}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm resize-none',
            'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-foreground placeholder:text-slate-600',
            'focus:outline-none focus:border-brand-500/40',
          )}
        />
      </FormField>

      <button className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
        'bg-brand-600 hover:bg-brand-500 text-foreground',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-brand',
      )}>
        <Save size={14} /> Save Changes
      </button>
    </div>
  )
}

function AppearanceSection() {
  const { theme, setTheme, accent, setAccent } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Appearance</h2>
        <p className="text-sm text-muted/60 mt-1">Customize the look and feel.</p>
      </div>

      <SectionTitle>Theme</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={cn(
              'flex flex-col items-center gap-2.5 py-4 rounded-2xl border transition-all duration-200',
              theme === id
                ? 'bg-brand-500/10 border-brand-500/25 text-brand-300'
                : 'bg-overlay-white/[0.02] border-overlay-white/[0.06] text-muted/60 hover:border-white/[0.12] hover:text-muted',
            )}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      <SectionTitle>Accent Color</SectionTitle>
      <div className="flex items-center gap-3">
        {ACCENT_COLORS.map(({ id, label, class: cls }) => (
          <button
            key={id}
            onClick={() => setAccent(id)}
            title={label}
            className={cn(
              'w-8 h-8 rounded-full transition-all duration-200',
              cls,
              accent === id ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-surface-950 scale-110' : 'hover:scale-105',
            )}
          />
        ))}
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    email: true, browser: false, taskReminders: true,
    weeklyReport: true, aiUpdates: false,
  })
  const toggle = (key) => setNotifs((n) => ({ ...n, [key]: !n[key] }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Notifications</h2>
        <p className="text-sm text-muted/60 mt-1">Control how and when you get notified.</p>
      </div>
      <SectionTitle>Channels</SectionTitle>
      <div className="rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.02] px-4">
        <Toggle label="Email Notifications"   checked={notifs.email}   onChange={() => toggle('email')} />
        <Toggle label="Browser Notifications" checked={notifs.browser} onChange={() => toggle('browser')} />
      </div>
      <SectionTitle>Activity</SectionTitle>
      <div className="rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.02] px-4">
        <Toggle label="Task Reminders"   checked={notifs.taskReminders}  onChange={() => toggle('taskReminders')} />
        <Toggle label="Weekly Report"    checked={notifs.weeklyReport}   onChange={() => toggle('weeklyReport')} />
        <Toggle label="AI Model Updates" checked={notifs.aiUpdates}      onChange={() => toggle('aiUpdates')} />
      </div>
    </div>
  )
}

function ApiKeysSection() {
  const [visible, setVisible]  = useState({})
  const [copied, setCopied]    = useState({})

  const copyKey = (id) => {
    setCopied((c) => ({ ...c, [id]: true }))
    setTimeout(() => setCopied((c) => ({ ...c, [id]: false })), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">API Keys</h2>
        <p className="text-sm text-muted/60 mt-1">Your keys are stored encrypted. Never share them.</p>
      </div>

      <div className="space-y-3">
        {API_KEYS.map(({ id, label, value, badge }) => (
          <div key={id} className={cn(
            'p-4 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.03]',
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-brand-400" />
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <Badge variant="brand" size="sm">{badge}</Badge>
              </div>
              <Badge variant="success" dot size="sm">Configured</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex-1 px-3 py-2 rounded-xl font-mono text-xs',
                'bg-overlay-white/[0.04] border border-overlay-white/[0.06] text-muted/60',
              )}>
                {visible[id] ? 'sk-actual-key-would-show-here' : value}
              </div>
              <button
                onClick={() => setVisible((v) => ({ ...v, [id]: !v[id] }))}
                className="w-8 h-8 rounded-lg bg-overlay-white/[0.06] flex items-center justify-center text-muted/60 hover:text-muted transition-colors"
              >
                {visible[id] ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={() => copyKey(id)}
                className="w-8 h-8 rounded-lg bg-overlay-white/[0.06] flex items-center justify-center text-muted/60 hover:text-muted transition-colors"
              >
                {copied[id] ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
        'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-muted/80',
        'hover:bg-overlay-white/[0.08] hover:text-foreground transition-all duration-200',
      )}>
        <Key size={14} /> Add New API Key
      </button>
    </div>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Privacy & Security</h2>
        <p className="text-sm text-muted/60 mt-1">Control your data and security settings.</p>
      </div>
      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-sm text-amber-400 font-medium">⚠️ Advanced security settings</p>
        <p className="text-xs text-amber-400/70 mt-1">Two-factor authentication, session management, and audit logs will be available in a later phase.</p>
      </div>
      <div className="space-y-2">
        {['Delete all conversation history', 'Export my data', 'Delete my account'].map((action) => (
          <button
            key={action}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl border',
              'border-overlay-white/[0.06] bg-overlay-white/[0.02] text-muted/80',
              'hover:bg-overlay-white/[0.06] hover:text-foreground transition-all duration-150',
              action === 'Delete my account' && 'border-rose-500/20 hover:bg-rose-500/10 text-rose-400',
            )}
          >
            <span className="text-sm">{action}</span>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}

const SECTION_CONTENT = {
  'profile':       <ProfileSection />,
  'appearance':    <AppearanceSection />,
  'notifications': <NotificationsSection />,
  'api-keys':      <ApiKeysSection />,
  'privacy':       <PrivacySection />,
}

// ── Settings Page ─────────────────────────────────────────────────────────────

export default function Settings() {
  const [active, setActive] = useState('profile')

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Left Nav ──────────────────────────────────────────────────── */}
        <aside className="w-full md:w-52 shrink-0">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon size={18} className="text-brand-400" />
            <h2 className="text-base font-bold text-foreground">Settings</h2>
          </div>
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap',
                  'transition-all duration-200 border',
                  active === id
                    ? 'bg-brand-500/15 text-brand-300 border-brand-500/20'
                    : 'text-muted/60 hover:text-muted hover:bg-white/[0.05] border-transparent',
                )}
              >
                <Icon size={16} className={active === id ? 'text-brand-400' : 'text-slate-600'} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 p-5 rounded-2xl border border-overlay-white/[0.06] bg-overlay-white/[0.02]">
          {SECTION_CONTENT[active]}
        </div>
      </div>
    </div>
  )
}
