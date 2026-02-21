'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { analyzePostcode, fetchReport } from '@/lib/api'
import { AnalyzeResponse, ReportResponse } from '@/lib/types'
import { PostcodeInput } from '@/components/PostcodeInput'
import { ApprovalProbability } from '@/components/panels/ApprovalProbability'
import { ViabilityScore } from '@/components/panels/ViabilityScore'
import { ConstraintsPanel } from '@/components/panels/ConstraintsPanel'
import { PlanningMetrics } from '@/components/panels/PlanningMetrics'
import { MarketMetrics } from '@/components/panels/MarketMetrics'
import { AIReport } from '@/components/panels/AIReport'
import { SkeletonCard, SkeletonGauge } from '@/components/ui/SkeletonCard'
import { LogOut, AlertCircle } from 'lucide-react'

// Dynamically import PlanningMap to avoid SSR issues with Leaflet
const PlanningMap = dynamic(
  () => import('@/components/map/PlanningMap').then((mod) => mod.PlanningMap),
  { ssr: false, loading: () => <SkeletonCard /> }
)

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null)
  const [reportData, setReportData] = useState<ReportResponse | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setToken(session.access_token)
    }
    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAnalyze = async (postcode: string) => {
    if (!token) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setReportLoading(true)
    setError(null)
    setAnalyzeData(null)
    setReportData(null)

    try {
      // Step 1: Analyze — show dashboard panels as soon as this completes
      const analyzeResult = await analyzePostcode(postcode, token)
      setAnalyzeData(analyzeResult)
      setLoading(false)

      // Step 2: Fetch AI report — /analyze result is now cached on the backend
      try {
        const reportResult = await fetchReport(postcode, token)
        setReportData(reportResult)
      } catch (reportErr) {
        console.error('Report generation failed:', reportErr)
      } finally {
        setReportLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze postcode')
      setLoading(false)
      setReportLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-black uppercase tracking-tighter">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-swiss-muted">
      {/* Header */}
      <header className="border-b-4 border-swiss-black bg-swiss-white sticky top-0 z-50">
        <div className="container mx-auto px-6 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-xl md:text-3xl font-black tracking-tighter hover:text-swiss-accent transition-colors cursor-pointer">
              PLANPILOT AI
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm uppercase tracking-wider opacity-60">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm uppercase font-bold tracking-wider hover:text-swiss-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 md:px-8 py-8 md:py-12">
        {/* Postcode Input */}
        <PostcodeInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 border-4 border-swiss-accent bg-swiss-accent bg-opacity-10 p-6 flex items-start gap-4"
          >
            <AlertCircle className="w-6 h-6 text-swiss-accent flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold uppercase tracking-wider mb-1">Analysis Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Summary Banner */}
        {!loading && analyzeData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 border-4 border-slate-800 bg-slate-900 text-white"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y-4 md:divide-y-0 md:divide-x-4 divide-white/10">
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Location</p>
                <p className="text-2xl font-black">{analyzeData.postcode}</p>
                <p className="text-xs opacity-50 mt-1">{analyzeData.location.district}</p>
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Approval Chance</p>
                <p className={`text-2xl font-black ${analyzeData.ml_prediction.approval_probability >= 0.7 ? 'text-green-400' : analyzeData.ml_prediction.approval_probability >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                  {(analyzeData.ml_prediction.approval_probability * 100).toFixed(1)}%
                </p>
                <p className="text-xs opacity-50 mt-1">ML Prediction</p>
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Viability Score</p>
                <p className={`text-2xl font-black ${analyzeData.viability_score >= 70 ? 'text-green-400' : analyzeData.viability_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {analyzeData.viability_score}<span className="text-sm opacity-60">/100</span>
                </p>
                <p className="text-xs opacity-50 mt-1">Overall Rating</p>
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Avg Price/m²</p>
                <p className="text-2xl font-black">£{analyzeData.market_metrics.avg_price_per_m2.toLocaleString('en-GB')}</p>
                <p className={`text-xs mt-1 ${analyzeData.market_metrics.price_trend_24m >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analyzeData.market_metrics.price_trend_24m >= 0 ? '▲' : '▼'} {Math.abs(analyzeData.market_metrics.price_trend_24m * 100).toFixed(1)}% 24m trend
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        {(loading || analyzeData) && (
          <div className="mt-8 md:mt-12 space-y-8">
            {/* Top Row: Map + Approval + Viability */}
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonGauge />
                  <SkeletonCard />
                </>
              ) : analyzeData ? (
                <>
                  <PlanningMap location={analyzeData.location} postcode={analyzeData.postcode} />
                  <ApprovalProbability probability={analyzeData.ml_prediction.approval_probability} />
                  <ViabilityScore score={analyzeData.viability_score} breakdown={analyzeData.viability_breakdown} />
                </>
              ) : null}
            </div>

            {/* Middle Row: Constraints + Planning Metrics */}
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : analyzeData ? (
                <>
                  <ConstraintsPanel constraints={analyzeData.constraints} />
                  <PlanningMetrics metrics={analyzeData.planning_metrics} />
                </>
              ) : null}
            </div>

            {/* Bottom Row: Market Metrics + AI Report */}
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : analyzeData ? (
                <>
                  <MarketMetrics metrics={analyzeData.market_metrics} />
                  {reportLoading ? (
                    <AIReport
                      report={{
                        overall_outlook: '',
                        key_risks: [],
                        strategic_recommendation: '',
                        risk_mitigation: [],
                      }}
                      generatedAt=""
                      loading={true}
                    />
                  ) : reportData ? (
                    <AIReport report={reportData.report} generatedAt={reportData.generated_at} />
                  ) : (
                    <div className="swiss-card">
                      <p className="text-center text-sm opacity-60">Report generation failed</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !analyzeData && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-24 text-center"
          >
            <p className="text-xl uppercase tracking-wider opacity-40">
              Enter a postcode to begin analysis
            </p>
          </motion.div>
        )}
      </div>
    </main>
  )
}
