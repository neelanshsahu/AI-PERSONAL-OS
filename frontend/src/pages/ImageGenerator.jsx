/**
 * Image Generator Page — Phase 9 AI integration
 */

import { useState, useEffect } from 'react'
import {
  Sparkles, Sliders, Download, RefreshCw,
  Maximize2, Image as ImageIcon, ChevronDown, Wand2, Info, Loader2, Trash2
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { api } from '@/services/api'
import { SelectField } from '@/components/ui/SelectField'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Constants ─────────────────────────────────────────────────────────────────

const STYLES = [
  { id: 'vivid',   label: 'Vivid',   emoji: '🎨' },
  { id: 'natural', label: 'Natural', emoji: '🌿' },
]

const SIZES = ['1024x1024', '1024x1536', '1536x1024']
const MODELS = ['gpt-image-1', 'dall-e-3', 'dall-e-2']

// Removed local SelectField in favor of shared component

function ImageCard({ image, onDelete }) {
  return (
    <div className={cn(
      'group relative aspect-square rounded-2xl overflow-hidden',
      'border border-overlay-white/[0.06] hover:border-white/[0.15]',
      'transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-brand',
    )}>
      <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
      
      {/* Label overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
        <p className="text-[10px] text-foreground/90 line-clamp-3 leading-snug">{image.prompt}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="neutral" size="sm">{image.model}</Badge>
          <Badge variant="neutral" size="sm">{image.size}</Badge>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={image.url} 
          target="_blank" 
          rel="noopener noreferrer"
          download={`generated-${image.id}.png`}
          className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-brand-500 transition-colors"
        >
          <Download size={11} />
        </a>
        <button 
          onClick={() => onDelete(image.id)}
          className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-rose-500 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Image Generator Page ──────────────────────────────────────────────────────

export default function ImageGenerator() {
  const [prompt, setPrompt]     = useState('')
  const [style, setStyle]       = useState('vivid')
  const [size, setSize]         = useState('1024x1024')
  const [model, setModel]       = useState('gpt-image-1')
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const data = await api.get('/api/v1/images/')
      setHistory(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    try {
      const newImg = await api.post('/api/v1/images/generate', {
        prompt: prompt.trim(),
        model,
        size,
        style
      })
      setHistory(prev => [newImg, ...prev])
      // We purposefully do NOT clear the prompt here so the user can edit/retry it.
    } catch (err) {
      alert(`Generation failed: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this image?')) return
    try {
      await api.delete(`/api/v1/images/${id}`)
      setHistory(prev => prev.filter(img => img.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div className="h-full animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">

        {/* ── Left: Controls ──────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">

          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles size={20} className="text-brand-400" /> Image Generator
            </h2>
            <p className="text-xs text-muted/60 mt-1">DALL·E 3 Integration</p>
          </div>

          {/* Prompt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted/60">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city at night, neon lights reflecting on rain-soaked streets, cinematic…"
              rows={4}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl text-sm resize-none',
                'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-muted placeholder:text-slate-600',
                'focus:outline-none focus:border-brand-500/40',
              )}
            />
            <p className="text-[10px] text-slate-700 text-right">{prompt.length}/1000</p>
          </div>

          {/* Style Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted/60">Style</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  disabled={model !== 'dall-e-3'}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
                    style === s.id && model === 'dall-e-3'
                      ? 'bg-brand-500/15 border-brand-500/30 text-brand-300'
                      : 'bg-overlay-white/[0.03] border-overlay-white/[0.06] text-muted/60 hover:text-muted hover:border-white/[0.12]',
                  )}
                >
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-[10px] leading-none">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model + Size */}
          <SelectField label="Model"       options={MODELS} value={model} onChange={setModel} />
          <SelectField label="Output Size" options={SIZES}  value={size}  onChange={setSize}  />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 py-3 rounded-xl',
              'text-sm font-semibold text-foreground',
              'bg-gradient-to-r from-brand-600 to-accent-600',
              'hover:from-brand-500 hover:to-accent-500',
              'border border-brand-500/20 shadow-glow-brand',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={14} />}
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-overlay-white/[0.02] border border-white/[0.05]">
            <Info size={13} className="text-slate-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              OpenAI will automatically refine your prompt to add more detail. You can view the revised prompt in the database.
            </p>
          </div>
        </div>

        {/* ── Right: Gallery ───────────────────────────────────────────────── */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-muted/60" />
              <h3 className="text-sm font-semibold text-foreground">Gallery</h3>
              <Badge variant="neutral" size="sm">{history.length} items</Badge>
            </div>
            <button 
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 text-xs text-muted/60 hover:text-brand-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={cn(loadingHistory && "animate-spin")} /> Refresh
            </button>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {loadingHistory ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))
            ) : history.length > 0 ? (
              history.map((img) => (
                <ImageCard key={img.id} image={img} onDelete={handleDelete} />
              ))
            ) : (
               <div className="col-span-full">
                 <EmptyState 
                   icon={ImageIcon} 
                   title="No images yet" 
                   description="Enter a prompt and hit generate to create your first masterpiece."
                 />
               </div>
            )}
          </div>

          {/* Prompt suggestions */}
          <div className="mt-6">
            <p className="text-xs text-slate-600 mb-3 flex items-center gap-1.5">
              <Wand2 size={11} /> Try these prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Futuristic city at sunset',
                'Abstract neural network',
                'Cozy coffee shop in rain',
                'Space station interior',
                'Fantasy forest with bioluminescence',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs',
                    'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-muted/60',
                    'hover:bg-overlay-white/[0.08] hover:text-muted hover:border-brand-500/20',
                    'transition-all duration-150',
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
