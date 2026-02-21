'use client'

import { motion } from 'framer-motion'
import { CircularGauge } from '@/components/ui/CircularGauge'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface ApprovalProbabilityProps {
  probability: number
}

export function ApprovalProbability({ probability }: ApprovalProbabilityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="swiss-card"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">
          Approval Probability
        </h3>
        <InfoTooltip text="ML-powered prediction based on historical planning decisions in this area. Higher percentage indicates greater likelihood of approval." />
      </div>

      <div className="flex justify-center">
        <CircularGauge
          value={probability * 100}
          max={100}
          label="Approval Chance"
        />
      </div>

      <div className="mt-8 pt-8 border-t-2 border-swiss-black">
        <p className="text-xs uppercase tracking-wider opacity-60 text-center">
          Based on {probability >= 0.7 ? 'strong' : probability >= 0.4 ? 'moderate' : 'weak'} historical data
        </p>
      </div>
    </motion.div>
  )
}
