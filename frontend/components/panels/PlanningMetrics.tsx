'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { CheckCircle, Clock, FileSearch, History } from 'lucide-react'

interface PlanningMetricsProps {
  metrics: {
    local_approval_rate: number
    avg_decision_time_days: number
    similar_applications_nearby: number
    recent_applications: Array<{
      reference: string
      postcode: string
      decision: string
      decision_date: string
      application_type: string
    }>
  }
}

export function PlanningMetrics({ metrics }: PlanningMetricsProps) {
  const noData = metrics.similar_applications_nearby === 0

  const approvalPct = (metrics.local_approval_rate * 100).toFixed(1)
  const approvalContext = noData
    ? { label: 'No data', cls: 'text-gray-400' }
    : metrics.local_approval_rate >= 0.8 ? { label: 'Very High', cls: 'text-green-600' }
    : metrics.local_approval_rate >= 0.65 ? { label: 'Above Average', cls: 'text-green-600' }
    : metrics.local_approval_rate >= 0.5 ? { label: 'Average', cls: 'text-amber-500' }
    : { label: 'Below Average', cls: 'text-red-600' }

  const decisionContext = noData
    ? { label: 'No data', cls: 'text-gray-400' }
    : metrics.avg_decision_time_days <= 70 ? { label: 'Fast', cls: 'text-green-600' }
    : metrics.avg_decision_time_days <= 105 ? { label: 'Typical', cls: 'text-amber-500' }
    : { label: 'Slow', cls: 'text-red-600' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="swiss-card"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">Planning Metrics</h3>
        <InfoTooltip text="Historical planning application data within 500m radius over the last 5 years." />
      </div>

      {noData && (
        <div className="mb-6 border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
            No planning history in our database for this area
          </p>
          <p className="text-xs text-amber-600 mt-0.5 opacity-80">
            Try a postcode in SE/SW/E London (e.g. SE14 6AF, SW9 8JH)
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Approval Rate */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Local Approval Rate</span>
              <InfoTooltip text="Percentage of planning applications approved within 500m over the last 5 years." />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black">{approvalPct}%</span>
              <span className={`text-xs font-black uppercase tracking-wider ${approvalContext.cls}`}>{approvalContext.label}</span>
            </div>
            <div className="mt-2 h-1.5 bg-swiss-muted border border-swiss-black overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${approvalPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${metrics.local_approval_rate >= 0.65 ? 'bg-green-600' : metrics.local_approval_rate >= 0.5 ? 'bg-amber-500' : 'bg-red-600'}`}
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Avg Decision Time</span>
              <InfoTooltip text="Average days from application submission to decision. Statutory target is 8 weeks (56 days) for minor applications." />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black">{Math.round(metrics.avg_decision_time_days)}</span>
              <span className="text-sm opacity-60">days</span>
              <span className={`text-xs font-black uppercase tracking-wider ${decisionContext.cls}`}>{decisionContext.label}</span>
            </div>
            <p className="text-xs opacity-40 mt-1">Statutory target: 56 days</p>
          </div>
        </div>

        {/* Similar Applications */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <FileSearch className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Similar Applications</span>
              <InfoTooltip text="Total planning applications within 500m in the last 5 years. Higher count = more established planning precedent." />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black">{metrics.similar_applications_nearby}</span>
              <span className="text-sm opacity-60">nearby</span>
              <span className="text-xs opacity-40">(500m · 5yr)</span>
            </div>
          </div>
        </div>

        {/* Recent Application History */}
        {metrics.recent_applications && metrics.recent_applications.length > 0 && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-widest font-bold opacity-60">Recent Street History</span>
                <InfoTooltip text="Last 5 planning decisions within 200m — the closest predictor for your application." />
              </div>
              <div className="space-y-2">
                {metrics.recent_applications.map((app, i) => (
                  <div key={i} className="border border-swiss-black/20 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold opacity-60 truncate mr-2">{app.reference}</span>
                      <span className={`text-xs font-black uppercase px-2 py-0.5 border-2 flex-shrink-0 ${
                        app.decision === 'approved'
                          ? 'border-green-600 text-green-700'
                          : 'border-red-600 text-red-700'
                      }`}>
                        {app.decision}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-50 truncate mr-2">{app.application_type}</span>
                      <span className="text-xs opacity-40 flex-shrink-0">
                        {new Date(app.decision_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
