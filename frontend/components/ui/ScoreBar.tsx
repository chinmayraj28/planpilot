'use client'

import { motion } from 'framer-motion'

interface ScoreBarProps {
  score: number
  max?: number
  label: string
  showBreakdown?: boolean
  breakdown?: {
    base_score: number
    constraint_penalty: number
    flood_penalty: number
    market_strength_bonus: number
  }
}

export function ScoreBar({ score, max = 100, label, showBreakdown, breakdown }: ScoreBarProps) {
  const percentage = (score / max) * 100
  const color = percentage >= 70 ? 'bg-green-600' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-600'
  const textColor = percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-amber-500' : 'text-red-600'

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-sm uppercase tracking-widest font-bold">{label}</span>
        <span className={`text-4xl font-black ${textColor}`}>{score.toFixed(0)}<span className="text-base opacity-40">/100</span></span>
      </div>

      <div className="relative h-6 border-4 border-swiss-black bg-swiss-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
        {/* tick marks */}
        {[25, 50, 75].map(tick => (
          <div key={tick} className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: `${tick}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-xs opacity-20 mt-1">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>

      {showBreakdown && breakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-6 border-2 border-swiss-black divide-y-2 divide-swiss-black text-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="uppercase tracking-wider flex-1">Base Score</span>
            <div className="w-24 h-2 bg-swiss-muted overflow-hidden border border-swiss-black/20">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.base_score / 80) * 100}%` }} transition={{ duration: 0.6 }} className="h-full bg-swiss-black" />
            </div>
            <span className="font-black text-right w-14">+{breakdown.base_score}</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-red-50">
            <span className="uppercase tracking-wider flex-1 text-red-700">Constraint Penalty</span>
            <div className="w-24 h-2 bg-swiss-muted overflow-hidden border border-swiss-black/20">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(Math.abs(breakdown.constraint_penalty) / 23) * 100}%` }} transition={{ duration: 0.6 }} className="h-full bg-red-500" />
            </div>
            <span className="font-black text-red-700 text-right w-14">{breakdown.constraint_penalty}</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-red-50">
            <span className="uppercase tracking-wider flex-1 text-red-700">Flood Penalty</span>
            <div className="w-24 h-2 bg-swiss-muted overflow-hidden border border-swiss-black/20">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(Math.abs(breakdown.flood_penalty) / 12) * 100}%` }} transition={{ duration: 0.6 }} className="h-full bg-red-500" />
            </div>
            <span className="font-black text-red-700 text-right w-14">{breakdown.flood_penalty}</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-green-50">
            <span className="uppercase tracking-wider flex-1 text-green-700">Market Bonus</span>
            <div className="w-24 h-2 bg-swiss-muted overflow-hidden border border-swiss-black/20">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.market_strength_bonus / 20) * 100}%` }} transition={{ duration: 0.6 }} className="h-full bg-green-500" />
            </div>
            <span className="font-black text-green-700 text-right w-14">+{breakdown.market_strength_bonus}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
