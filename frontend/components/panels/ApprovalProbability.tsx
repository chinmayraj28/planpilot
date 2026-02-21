'use client'

import { motion } from 'framer-motion'
import { CircularGauge } from '@/components/ui/CircularGauge'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface ApprovalProbabilityProps {
  probability: number
}

export function ApprovalProbability({ probability }: ApprovalProbabilityProps) {
  const pct = probability * 100
  const verdict = pct >= 75 ? { label: 'HIGH LIKELIHOOD', cls: 'bg-green-600 text-white' }
    : pct >= 50 ? { label: 'MODERATE LIKELIHOOD', cls: 'bg-amber-500 text-white' }
    : { label: 'LOW LIKELIHOOD', cls: 'bg-red-600 text-white' }

  const context = pct >= 75
    ? 'Strong historical approval rate in this area. Well-designed applications are likely to succeed.'
    : pct >= 50
    ? 'Mixed local planning history. Quality of application and engagement with the LPA will be decisive.'
    : 'Challenging planning environment. Pre-application consultation strongly recommended before proceeding.'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="swiss-card overflow-hidden"
    >
      {/* Verdict strip */}
      <div className={`-mx-8 -mt-8 mb-8 px-8 py-3 ${verdict.cls} flex items-center justify-between`}>
        <span className="text-xs font-black uppercase tracking-widest">{verdict.label}</span>
        <InfoTooltip text="ML-powered prediction based on historical planning decisions in this area." />
      </div>

      <h3 className="text-lg font-black uppercase tracking-tight mb-6">Approval Probability</h3>

      <div className="flex justify-center">
        <CircularGauge value={pct} max={100} label="Approval Chance" />
      </div>

      <div className="mt-6 pt-6 border-t-2 border-swiss-black">
        <p className="text-xs leading-relaxed opacity-60 text-center">{context}</p>
      </div>
    </motion.div>
  )
}
