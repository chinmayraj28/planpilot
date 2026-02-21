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
      // Fire both requests in parallel
      const [analyzeResult, reportResult] = await Promise.allSettled([
        analyzePostcode(postcode, token),
        fetchReport(postcode, token),
      ])

      // Handle analyze result
      if (analyzeResult.status === 'fulfilled') {
        setAnalyzeData(analyzeResult.value)
      } else {
        throw new Error('Failed to analyze postcode')
      }

      // Handle report result (may take longer)
      if (reportResult.status === 'fulfilled') {
        setReportData(reportResult.value)
        setReportLoading(false)
      } else {
        setReportLoading(false)
        console.error('Report generation failed:', reportResult.reason)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze postcode')
    } finally {
      setLoading(false)
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
