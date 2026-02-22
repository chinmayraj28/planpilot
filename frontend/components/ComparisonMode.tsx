'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, Loader2, ArrowRight, Scale, MapPin } from 'lucide-react'
import { analyzePostcode } from '@/lib/api'
import type { AnalyzeResponse } from '@/lib/types'

interface ComparisonModeProps {
  token: string
  /** Pre-populate the first slot if the user already has an analysis */
  initialData?: AnalyzeResponse
}

interface ComparisonSlot {
  postcode: string
  loading: boolean
  data: AnalyzeResponse | null
  error: string | null
}

const MAX_SLOTS = 3

function MetricRow({ label, values, format, colorFn }: {
  label: string
  values: (string | number | boolean | null)[]
  format?: (v: any) => string
  colorFn?: (v: any) => string
}) {
  return (
    <div className="flex items-stretch border-b-2 border-black/5 last:border-b-0">
      <div className="w-24 sm:w-40 flex-shrink-0 px-2 sm:px-4 py-3 text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center">
        {label}
      </div>
      {values.map((v, i) => {
        const display = v == null ? '—' : format ? format(v) : String(v)
        const color = v != null && colorFn ? colorFn(v) : ''
        return (
          <div key={i} className="flex-1 px-4 py-3 text-sm font-black text-center border-l-2 border-black/5">
            <span className={color}>{display}</span>
          </div>
        )
      })}
      {/* Pad empty slots */}
      {Array.from({ length: MAX_SLOTS - values.length }).map((_, i) => (
        <div key={`pad-${i}`} className="flex-1 px-4 py-3 border-l-2 border-black/5" />
      ))}
    </div>
  )
}

export function ComparisonMode({ token, initialData }: ComparisonModeProps) {
  const [slots, setSlots] = useState<ComparisonSlot[]>(() => {
    if (initialData) {
      return [{ postcode: initialData.postcode, loading: false, data: initialData, error: null }]
    }
    return []
  })

  const [inputValue, setInputValue] = useState('')

  const addSlot = useCallback(async (postcode: string) => {
    const pc = postcode.trim().toUpperCase()
    if (!pc) return
    if (slots.some(s => s.postcode === pc)) return
    if (slots.length >= MAX_SLOTS) return

    const idx = slots.length
    setSlots(prev => [...prev, { postcode: pc, loading: true, data: null, error: null }])
    setInputValue('')

    try {
      const result = await analyzePostcode(pc, token)
      setSlots(prev => prev.map((s, i) => i === idx ? { ...s, loading: false, data: result } : s))
    } catch (err: any) {
      setSlots(prev => prev.map((s, i) => i === idx ? { ...s, loading: false, error: err.message } : s))
    }
  }, [slots, token])

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx))
  }

  const filledSlots = slots.filter(s => s.data)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Scale className="w-5 h-5 opacity-40" />
        <h2 className="text-sm font-black uppercase tracking-widest">Compare Postcodes</h2>
        <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
        <span className="text-xs opacity-30">{slots.length}/{MAX_SLOTS}</span>
      </div>

      {/* Slot cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.postcode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-4 border-black dark:border-white/15 bg-white dark:bg-[#111] p-4 relative"
          >
            <button
              onClick={() => removeSlot(i)}
              className="absolute top-2 right-2 opacity-30 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {slot.loading ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <Loader2 className="w-5 h-5 animate-spin text-swiss-accent" />
                <p className="text-xs uppercase tracking-wider font-bold opacity-40">{slot.postcode}</p>
              </div>
            ) : slot.error ? (
              <div className="py-4">
                <p className="text-sm font-black">{slot.postcode}</p>
                <p className="text-xs text-red-600 mt-1">{slot.error}</p>
              </div>
            ) : slot.data ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-swiss-accent" />
                  <p className="text-lg font-black tracking-tight">{slot.data.postcode}</p>
                </div>
                <p className="text-xs opacity-40">{slot.data.location.district} · {slot.data.location.ward}</p>
                <div className="flex gap-3 mt-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">Approval</p>
                    <p className="text-lg font-black">{(slot.data.ml_prediction.approval_probability * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">Viability</p>
                    <p className="text-lg font-black">{slot.data.viability_score.toFixed(0)}/100</p>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        ))}

        {/* Add postcode input */}
        {slots.length < MAX_SLOTS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-4 border-dashed border-black/20 p-4 flex flex-col items-center justify-center gap-3"
          >
            <form
              onSubmit={e => { e.preventDefault(); addSlot(inputValue) }}
              className="flex items-center gap-2 w-full"
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value.toUpperCase())}
                placeholder="Add postcode"
                className="flex-1 border-2 border-black dark:border-white/20 bg-transparent dark:text-white px-3 py-2 text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-swiss-accent"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || slots.length >= MAX_SLOTS}
                className="w-10 h-10 border-2 border-black dark:border-white/20 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Comparison table */}
      <AnimatePresence>
        {filledSlots.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-4 border-black dark:border-white/15 bg-white dark:bg-[#111] overflow-x-auto"
          >
            <div className="px-4 py-3 bg-black text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-widest">Side-by-Side Comparison</p>
            </div>

            {/* Column headers */}
            <div className="flex border-b-4 border-black dark:border-white/15 min-w-[300px]">
              <div className="w-24 sm:w-40 flex-shrink-0 px-2 sm:px-4 py-3 text-[10px] uppercase tracking-widest font-bold opacity-30">Metric</div>
              {filledSlots.map(s => (
                <div key={s.postcode} className="flex-1 px-4 py-3 text-sm font-black text-center border-l-2 border-black/5">
                  {s.data!.postcode}
                </div>
              ))}
              {Array.from({ length: MAX_SLOTS - filledSlots.length }).map((_, i) => (
                <div key={`hpad-${i}`} className="flex-1 px-4 py-3 border-l-2 border-black/5" />
              ))}
            </div>

            <MetricRow
              label="Approval"
              values={filledSlots.map(s => s.data!.ml_prediction.approval_probability)}
              format={(v: number) => `${(v * 100).toFixed(1)}%`}
              colorFn={(v: number) => v >= 0.7 ? 'text-green-600' : v >= 0.45 ? 'text-amber-600' : 'text-red-600'}
            />
            <MetricRow
              label="Viability"
              values={filledSlots.map(s => s.data!.viability_score)}
              format={(v: number) => `${v.toFixed(0)}/100`}
              colorFn={(v: number) => v >= 70 ? 'text-green-600' : v >= 40 ? 'text-amber-600' : 'text-red-600'}
            />
            <MetricRow
              label="Avg Price/m²"
              values={filledSlots.map(s => s.data!.market_metrics.avg_price_per_m2)}
              format={(v: number) => `£${v.toLocaleString('en-GB')}`}
            />
            <MetricRow
              label="Price Trend"
              values={filledSlots.map(s => s.data!.market_metrics.price_trend_24m)}
              format={(v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`}
              colorFn={(v: number) => v >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricRow
              label="Avg EPC"
              values={filledSlots.map(s => s.data!.market_metrics.avg_epc_rating)}
            />
            <MetricRow
              label="Flood Zone"
              values={filledSlots.map(s => s.data!.constraints.flood_zone)}
              colorFn={(v: number) => v === 1 ? 'text-green-600' : v === 2 ? 'text-amber-600' : 'text-red-600'}
            />
            <MetricRow
              label="Conservation"
              values={filledSlots.map(s => s.data!.constraints.in_conservation_area)}
              format={(v: boolean) => v ? 'Yes' : 'No'}
              colorFn={(v: boolean) => v ? 'text-amber-600' : 'text-green-600'}
            />
            <MetricRow
              label="Green Belt"
              values={filledSlots.map(s => s.data!.constraints.in_greenbelt)}
              format={(v: boolean) => v ? 'Yes' : 'No'}
              colorFn={(v: boolean) => v ? 'text-red-600' : 'text-green-600'}
            />
            <MetricRow
              label="Decision Time"
              values={filledSlots.map(s => s.data!.planning_metrics.avg_decision_time_days)}
              format={(v: number) => `${v.toFixed(0)} days`}
            />
            <MetricRow
              label="Local Approval Rate"
              values={filledSlots.map(s => s.data!.planning_metrics.local_approval_rate)}
              format={(v: number) => `${(v * 100).toFixed(0)}%`}
              colorFn={(v: number) => v >= 0.7 ? 'text-green-600' : v >= 0.5 ? 'text-amber-600' : 'text-red-600'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {filledSlots.length < 2 && slots.length > 0 && (
        <p className="text-xs text-center opacity-30 uppercase tracking-wider font-bold">
          Add at least 2 postcodes to see a comparison
        </p>
      )}
    </div>
  )
}
