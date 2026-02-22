'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { GraduationCap, MapPin } from 'lucide-react'

interface School {
  name: string
  type: string
  ofsted_rating: string
  distance_m: number
}

interface SchoolsPanelProps {
  schools: School[]
}

// Colour-code school type chips
const TYPE_CHIP: Record<string, string> = {
  'Primary':              'bg-blue-100 text-blue-800',
  'Secondary':            'bg-purple-100 text-purple-800',
  'Grammar School':       'bg-green-100 text-green-800',
  'Academy':              'bg-indigo-100 text-indigo-800',
  'Primary Academy':      'bg-indigo-100 text-indigo-800',
  'Secondary Academy':    'bg-indigo-100 text-indigo-800',
  'Free School':          'bg-teal-100 text-teal-800',
  'Independent School':   'bg-amber-100 text-amber-800',
  'Community School':     'bg-slate-100 text-slate-700',
}

function typeChipClass(type: string): string {
  // Try exact match first, then prefix match
  if (TYPE_CHIP[type]) return TYPE_CHIP[type]
  for (const key of Object.keys(TYPE_CHIP)) {
    if (type.startsWith(key) || key.startsWith(type.split(' ')[0])) return TYPE_CHIP[key]
  }
  return 'bg-gray-100 text-gray-600'
}

function formatDistance(m: number): string {
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
}

export function SchoolsPanel({ schools }: SchoolsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="swiss-card"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">Nearby Schools</h3>
        <InfoTooltip text="Schools within 0.75 miles, sourced from OpenStreetMap. Proximity to good schools is a significant driver of local property values." />
      </div>

      {schools.length === 0 ? (
        <div className="flex items-center gap-4 py-4">
          <GraduationCap className="w-8 h-8 opacity-20" />
          <p className="text-sm opacity-40">No schools found within 0.75 miles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schools.map((school, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="border-2 border-swiss-black/20 p-4 hover:border-swiss-black transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-40" />
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-tight">{school.name}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${typeChipClass(school.type)}`}>
                      {school.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-50 flex-shrink-0 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="font-bold">{formatDistance(school.distance_m)}</span>
                </div>
              </div>
            </motion.div>
          ))}

          <p className="text-xs opacity-30 pt-2">
            Source: OpenStreetMap. Ofsted ratings require the DfE GIAS dataset.
            Schools near good catchment areas can add 5–15% to property values.
          </p>
        </div>
      )}
    </motion.div>
  )
}
