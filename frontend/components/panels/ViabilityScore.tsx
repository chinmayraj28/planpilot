'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ViabilityScoreProps {
  score: number
  breakdown: {
    base_score: number
    constraint_penalty: number
    flood_penalty: number
    market_strength_bonus: number
  }
}

export function ViabilityScore({ score, breakdown }: ViabilityScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="swiss-card"
    >
      <div className="flex items-start justify-between mb-4 sm:mb-8">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">
            Viability Score
          </h3>
          <p className="text-xs opacity-50 mt-1">Source: PlanPilot viability model (constraints + market data)</p>
        </div>
        <InfoTooltip text="Comprehensive 0-100 score evaluating development viability. Factors include constraints, flood risk, and market conditions." />
      </div>

      <ScoreBar
        score={score}
        label="Overall Viability"
        showBreakdown={showBreakdown}
        breakdown={breakdown}
      />

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="mt-6 w-full flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-bold hover:text-swiss-accent transition-colors"
      >
        {showBreakdown ? (
          <>
            Hide Breakdown <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Show Breakdown <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.div>
  )
}
