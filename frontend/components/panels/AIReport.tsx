'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { FileText, AlertCircle, Target, Shield, Sparkles } from 'lucide-react'

interface AIReportProps {
  report: {
    overall_outlook: string
    key_risks: string[]
    strategic_recommendation: string
    risk_mitigation: string[]
  }
  generatedAt: string
  loading?: boolean
}

export function AIReport({ report, generatedAt, loading }: AIReportProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="swiss-card animate-pulse"
      >
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-6 h-6 animate-spin" />
          <h3 className="text-lg font-black uppercase tracking-tight">
            AI Planning Report
          </h3>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-swiss-muted w-full" />
          <div className="h-4 bg-swiss-muted w-5/6" />
          <div className="h-4 bg-swiss-muted w-4/6" />
          <div className="h-8 bg-swiss-muted w-full mt-8" />
          <div className="h-4 bg-swiss-muted w-3/4" />
        </div>
        <p className="text-xs uppercase tracking-wider opacity-40 text-center mt-8">
          Generating insights with Gemini 2.0...
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="swiss-card"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <h3 className="text-lg font-black uppercase tracking-tight">
            AI Planning Report
          </h3>
        </div>
        <InfoTooltip text="AI-generated strategic analysis and recommendations powered by Gemini 2.0 Flash." />
      </div>

      <div className="space-y-8">
        {/* Overall Outlook */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-4 border-swiss-black flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Overall Outlook
            </h4>
          </div>
          <p className="text-base leading-relaxed pl-11">
            {report.overall_outlook}
          </p>
        </div>

        {/* Key Risks */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-4 border-swiss-accent bg-swiss-accent text-swiss-white flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Key Risks
            </h4>
          </div>
          <ul className="space-y-2 pl-11">
            {report.key_risks.map((risk, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="w-2 h-2 bg-swiss-accent flex-shrink-0 mt-2" />
                <span className="text-sm leading-relaxed">{risk}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Strategic Recommendation */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-4 border-swiss-black flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Strategic Recommendation
            </h4>
          </div>
          <p className="text-base leading-relaxed pl-11">
            {report.strategic_recommendation}
          </p>
        </div>

        {/* Risk Mitigation */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-4 border-swiss-black flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Risk Mitigation
            </h4>
          </div>
          <ul className="space-y-2 pl-11">
            {report.risk_mitigation.map((mitigation, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="w-2 h-2 bg-swiss-black flex-shrink-0 mt-2" />
                <span className="text-sm leading-relaxed">{mitigation}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-8 border-t-2 border-swiss-black">
        <p className="text-xs uppercase tracking-wider opacity-40 text-center">
          Generated by Gemini 2.0 Flash • {new Date(generatedAt).toLocaleString('en-GB')}
        </p>
      </div>
    </motion.div>
  )
}
