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
  const color =
    percentage >= 70
      ? 'bg-green-600'
      : percentage >= 40
      ? 'bg-amber-500'
      : 'bg-red-600'

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-sm uppercase tracking-widest font-bold">{label}</span>
        <span className="text-3xl font-black">{score.toFixed(0)}</span>
      </div>

      <div className="relative h-8 border-4 border-swiss-black bg-swiss-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>

      {showBreakdown && breakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-6 space-y-3 text-sm"
        >
          <div className="flex justify-between">
            <span className="uppercase tracking-wider">Base Score</span>
            <span className="font-bold">+{breakdown.base_score}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span className="uppercase tracking-wider">Constraint Penalty</span>
            <span className="font-bold">-{breakdown.constraint_penalty}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span className="uppercase tracking-wider">Flood Penalty</span>
            <span className="font-bold">-{breakdown.flood_penalty}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span className="uppercase tracking-wider">Market Bonus</span>
            <span className="font-bold">+{breakdown.market_strength_bonus}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
