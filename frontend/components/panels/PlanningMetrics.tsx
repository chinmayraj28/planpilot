'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { CheckCircle, Clock, FileSearch } from 'lucide-react'

interface PlanningMetricsProps {
  metrics: {
    local_approval_rate: number
    avg_decision_time_days: number
    similar_applications_nearby: number
  }
}

export function PlanningMetrics({ metrics }: PlanningMetricsProps) {
  const approvalPercentage = (metrics.local_approval_rate * 100).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="swiss-card"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">
          Planning Metrics
        </h3>
        <InfoTooltip text="Historical planning data for this local authority area." />
      </div>

      <div className="space-y-6">
        {/* Approval Rate */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                Local Approval Rate
              </span>
              <InfoTooltip text="Percentage of planning applications approved by the local authority in the past 12 months." />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{approvalPercentage}%</span>
              <span className="text-sm opacity-60">of applications</span>
            </div>
            <div className="mt-3 h-2 border-2 border-swiss-black bg-swiss-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${approvalPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${
                  metrics.local_approval_rate >= 0.7
                    ? 'bg-green-600'
                    : metrics.local_approval_rate >= 0.5
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Decision Time */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                Avg Decision Time
              </span>
              <InfoTooltip text="Average number of days from submission to decision for planning applications in this area." />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{Math.round(metrics.avg_decision_time_days)}</span>
              <span className="text-sm opacity-60">days</span>
            </div>
          </div>
        </div>

        {/* Similar Applications */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <FileSearch className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                Similar Applications
              </span>
              <InfoTooltip text="Number of similar planning applications submitted within 1km in the past 24 months." />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{metrics.similar_applications_nearby}</span>
              <span className="text-sm opacity-60">nearby</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
