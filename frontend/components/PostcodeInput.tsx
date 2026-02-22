'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Settings2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import type { ProjectParams, ApplicationType, PropertyType, ManualOverrides } from '@/lib/types'

interface PostcodeInputProps {
  onAnalyze: (postcode: string, params: ProjectParams, overrides?: ManualOverrides) => void
  loading: boolean
}

const APPLICATION_TYPES: { value: ApplicationType; label: string }[] = [
  { value: 'extension', label: 'Extension' },
  { value: 'new_build', label: 'New Build' },
  { value: 'loft_conversion', label: 'Loft Conversion' },
  { value: 'change_of_use', label: 'Change of Use' },
  { value: 'listed_building', label: 'Listed Building' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'other', label: 'Other' },
]

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-Detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land Only' },
]

/** Which override fields the user has opted in to. */
type OverrideKey = keyof ManualOverrides
const OVERRIDE_FIELDS: { key: OverrideKey; label: string; group: 'constraints' | 'planning' | 'market' }[] = [
  { key: 'flood_zone',                  label: 'Flood Zone',              group: 'constraints' },
  { key: 'in_conservation_area',        label: 'Conservation Area',       group: 'constraints' },
  { key: 'in_greenbelt',                label: 'Green Belt',              group: 'constraints' },
  { key: 'in_article4_zone',            label: 'Article 4 Zone',          group: 'constraints' },
  { key: 'local_approval_rate',         label: 'Local Approval Rate',     group: 'planning' },
  { key: 'avg_decision_time_days',      label: 'Avg Decision Time',       group: 'planning' },
  { key: 'similar_applications_nearby', label: 'Similar Apps Nearby',     group: 'planning' },
  { key: 'avg_price_per_m2',            label: 'Avg Price / m²',          group: 'market' },
  { key: 'price_trend_24m',             label: 'Price Trend (24m)',       group: 'market' },
  { key: 'avg_epc_rating',              label: 'Avg EPC Rating',          group: 'market' },
]

export function PostcodeInput({ onAnalyze, loading }: PostcodeInputProps) {
  const [postcode, setPostcode] = useState('')
  const [applicationType, setApplicationType] = useState<ApplicationType>('extension')
  const [propertyType, setPropertyType] = useState<PropertyType>('semi_detached')
  const [numStoreys, setNumStoreys] = useState(1)
  const [floorArea, setFloorArea] = useState(30)

  // Advanced overrides
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [enabledOverrides, setEnabledOverrides] = useState<Set<OverrideKey>>(new Set())
  const [overrideValues, setOverrideValues] = useState<ManualOverrides>({})

  const toggleOverride = (key: OverrideKey) => {
    const next = new Set(enabledOverrides)
    if (next.has(key)) {
      next.delete(key)
      const v = { ...overrideValues }
      delete v[key]
      setOverrideValues(v)
    } else {
      next.add(key)
    }
    setEnabledOverrides(next)
  }

  const setOverrideValue = (key: OverrideKey, raw: string) => {
    const v = { ...overrideValues }

    if (key === 'in_conservation_area' || key === 'in_greenbelt' || key === 'in_article4_zone') {
      v[key] = raw === 'true'
    } else if (key === 'avg_epc_rating') {
      v[key] = raw.toUpperCase()
    } else if (key === 'flood_zone') {
      v[key] = parseInt(raw) as 1 | 2 | 3
    } else {
      const num = parseFloat(raw)
      if (!isNaN(num)) (v as any)[key] = num
    }

    setOverrideValues(v)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postcode.trim()) return

    const overrides: ManualOverrides = {}
    for (const key of enabledOverrides) {
      if (overrideValues[key] !== undefined) {
        (overrides as any)[key] = overrideValues[key]
      }
    }
    const hasOverrides = Object.keys(overrides).length > 0

    onAnalyze(
      postcode.trim().toUpperCase(),
      {
        application_type: applicationType,
        property_type: propertyType,
        num_storeys: numStoreys,
        estimated_floor_area_m2: floorArea,
      },
      hasOverrides ? overrides : undefined,
    )
  }

  const enabledCount = enabledOverrides.size

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-4 border-swiss-black bg-swiss-white p-8 md:p-12 swiss-grid-pattern"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
          ANALYZE
          <br />
          POSTCODE
        </h2>
        <p className="text-lg mb-8 opacity-80">
          Enter your postcode and project details for a personalised planning assessment
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Postcode input */}
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 opacity-40" />
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
              className="w-full border-4 border-swiss-black px-16 py-6 text-2xl font-bold uppercase tracking-wider focus:outline-none focus:border-swiss-accent transition-colors"
              disabled={loading}
            />
          </div>

          {/* Project parameters grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Application Type</label>
              <div className="relative">
                <select value={applicationType} onChange={(e) => setApplicationType(e.target.value as ApplicationType)} disabled={loading} className="w-full border-4 border-swiss-black px-4 py-3 text-sm font-bold appearance-none bg-white focus:outline-none focus:border-swiss-accent transition-colors cursor-pointer">
                  {APPLICATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Property Type</label>
              <div className="relative">
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} disabled={loading} className="w-full border-4 border-swiss-black px-4 py-3 text-sm font-bold appearance-none bg-white focus:outline-none focus:border-swiss-accent transition-colors cursor-pointer">
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Storeys</label>
              <div className="relative">
                <select value={numStoreys} onChange={(e) => setNumStoreys(parseInt(e.target.value))} disabled={loading} className="w-full border-4 border-swiss-black px-4 py-3 text-sm font-bold appearance-none bg-white focus:outline-none focus:border-swiss-accent transition-colors cursor-pointer">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'Storey' : 'Storeys'}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Floor Area (m²)</label>
              <input type="number" value={floorArea} onChange={(e) => setFloorArea(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={10000} disabled={loading} className="w-full border-4 border-swiss-black px-4 py-3 text-sm font-bold focus:outline-none focus:border-swiss-accent transition-colors" />
            </div>
          </div>

          {/* ── Advanced: Manual Overrides ── */}
          <div className="border-t-2 border-black/10 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity"
            >
              <Settings2 className="w-4 h-4" />
              Advanced — Manual Overrides
              {enabledCount > 0 && (
                <span className="bg-swiss-accent text-white px-2 py-0.5 text-[10px] font-black">
                  {enabledCount} active
                </span>
              )}
              <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-5">
                    <p className="text-xs opacity-50 leading-relaxed">
                      By default, all location data is auto-fetched from our database. Toggle any field below to
                      manually override it with your own value. Untoggled fields will still be fetched automatically.
                    </p>

                    <OverrideGroup title="Constraints" fields={OVERRIDE_FIELDS.filter(f => f.group === 'constraints')} enabled={enabledOverrides} values={overrideValues} onToggle={toggleOverride} onChange={setOverrideValue} disabled={loading} />
                    <OverrideGroup title="Planning History" fields={OVERRIDE_FIELDS.filter(f => f.group === 'planning')} enabled={enabledOverrides} values={overrideValues} onToggle={toggleOverride} onChange={setOverrideValue} disabled={loading} />
                    <OverrideGroup title="Market Data" fields={OVERRIDE_FIELDS.filter(f => f.group === 'market')} enabled={enabledOverrides} values={overrideValues} onToggle={toggleOverride} onChange={setOverrideValue} disabled={loading} />

                    {enabledCount > 0 && (
                      <button type="button" onClick={() => { setEnabledOverrides(new Set()); setOverrideValues({}) }} className="flex items-center gap-1 text-xs text-swiss-accent font-bold uppercase tracking-wider hover:underline">
                        <X className="w-3 h-3" /> Clear all overrides
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !postcode.trim()}
            className="swiss-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

/* ── Override Group Component ── */
function OverrideGroup({ title, fields, enabled, values, onToggle, onChange, disabled }: {
  title: string; fields: typeof OVERRIDE_FIELDS; enabled: Set<OverrideKey>; values: ManualOverrides
  onToggle: (key: OverrideKey) => void; onChange: (key: OverrideKey, raw: string) => void; disabled: boolean
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((field) => {
          const isOn = enabled.has(field.key)
          return (
            <div key={field.key} className={`flex items-center gap-3 px-4 py-3 border-2 transition-colors ${isOn ? 'border-swiss-accent bg-swiss-accent/5' : 'border-black/10 bg-white'}`}>
              <button type="button" onClick={() => onToggle(field.key)} disabled={disabled} className="flex-shrink-0" aria-label={`Toggle ${field.label}`}>
                {isOn ? <ToggleRight className="w-6 h-6 text-swiss-accent" /> : <ToggleLeft className="w-6 h-6 opacity-30" />}
              </button>
              <span className={`text-xs font-bold uppercase tracking-wider flex-shrink-0 ${isOn ? '' : 'opacity-40'}`}>{field.label}</span>
              <AnimatePresence>
                {isOn && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="ml-auto overflow-hidden">
                    <OverrideInput field={field} value={values[field.key]} onChange={(raw) => onChange(field.key, raw)} disabled={disabled} />
                  </motion.div>
                )}
              </AnimatePresence>
              {!isOn && <span className="ml-auto text-[10px] opacity-30 uppercase tracking-wider">Auto</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Individual Override Input ── */
function OverrideInput({ field, value, onChange, disabled }: {
  field: typeof OVERRIDE_FIELDS[number]; value: any; onChange: (raw: string) => void; disabled: boolean
}) {
  const base = "border-2 border-swiss-black px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-swiss-accent transition-colors"

  if (field.key === 'in_conservation_area' || field.key === 'in_greenbelt' || field.key === 'in_article4_zone') {
    return (
      <select value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${base} w-20 appearance-none bg-white cursor-pointer`}>
        <option value="">—</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  if (field.key === 'flood_zone') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${base} w-20 appearance-none bg-white cursor-pointer`}>
        <option value="">—</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    )
  }

  if (field.key === 'avg_epc_rating') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${base} w-20 appearance-none bg-white cursor-pointer`}>
        <option value="">—</option>
        {['A','B','C','D','E','F','G'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    )
  }

  const placeholders: Record<string, string> = {
    local_approval_rate: '0.0–1.0',
    avg_decision_time_days: 'days',
    similar_applications_nearby: 'count',
    avg_price_per_m2: '£/m²',
    price_trend_24m: '±0.05',
  }

  return (
    <input type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholders[field.key] || ''} disabled={disabled} className={`${base} w-24`} />
  )
}
