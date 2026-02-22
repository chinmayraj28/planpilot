'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { analyzePostcode, fetchReport } from '@/lib/api'
import { exportToCSV } from '@/lib/csv'
import { AnalyzeResponse, ReportResponse, ProjectParams, ManualOverrides } from '@/lib/types'
import { Sidebar, Tab, HistoryEntry, TABS } from '@/components/Sidebar'
import { ApprovalProbability } from '@/components/panels/ApprovalProbability'
import { ViabilityScore } from '@/components/panels/ViabilityScore'
import { ConstraintsPanel } from '@/components/panels/ConstraintsPanel'
import { PlanningMetrics } from '@/components/panels/PlanningMetrics'
import { MarketMetrics } from '@/components/panels/MarketMetrics'
import { AIReport } from '@/components/panels/AIReport'
import { BuildCostCalculator } from '@/components/panels/BuildCostCalculator'
import { SolarPotential } from '@/components/panels/SolarPotential'
import { SchoolsPanel } from '@/components/panels/SchoolsPanel'
import { ComparisonMode } from '@/components/ComparisonMode'
import { SkeletonCard, SkeletonGauge } from '@/components/ui/SkeletonCard'
import { PostcodeInput } from '@/components/PostcodeInput'
import { AlertCircle, FileDown, FileSpreadsheet, MapPin, Percent, BarChart2, PoundSterling, Zap, Menu, X, Plus, Share2, Moon, Sun, Scale, Check, UserCircle } from 'lucide-react'
import Link from 'next/link'

const PlanningMap = dynamic(
  () => import('@/components/map/PlanningMap').then(m => m.PlanningMap),
  { ssr: false, loading: () => <SkeletonCard /> }
)

// ── localStorage helpers ──────────────────────────────────────────────────────
const HISTORY_KEY = 'planpilot_history'
const MAX_HISTORY = 8

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') }
  catch { return [] }
}

function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory().filter(h => h.postcode !== entry.postcode)
  const next = [entry, ...existing].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

// ── Section header helper ─────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 sm:mb-6">
      <div className="w-1.5 h-6 bg-swiss-accent flex-shrink-0" />
      <div className="min-w-0">
        <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="text-xs opacity-40 mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-black/10" />
    </div>
  )
}

// ── Stat card helper ──────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color = 'text-swiss-black', icon: Icon,
}: {
  label: string; value: string; sub?: string; color?: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-white dark:bg-[#111] border-4 border-black dark:border-white/15 p-5 flex items-start gap-4">
      <div className="w-10 h-10 border-2 border-black/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">{label}</p>
        <p className={`text-2xl font-black leading-none truncate ${color}`}>{value}</p>
        {sub && <p className="text-xs opacity-40 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Tab content components ────────────────────────────────────────────────────
function OverviewTab({
  data, reportData, reportLoading, loading,
}: {
  data: AnalyzeResponse | null
  reportData: ReportResponse | null
  reportLoading: boolean
  loading: boolean
}) {
  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white border-4 border-black animate-pulse" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonGauge /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  if (!data) return <EmptyState />

  const approvalPct = data.ml_prediction.approval_probability * 100
  const trendPct = data.market_metrics.price_trend_24m * 100

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Percent}
          label="Approval Probability"
          value={`${approvalPct.toFixed(1)}%`}
          color={approvalPct >= 70 ? 'text-green-600' : approvalPct >= 45 ? 'text-amber-600' : 'text-red-600'}
          sub="ML prediction"
        />
        <StatCard
          icon={BarChart2}
          label="Viability Score"
          value={`${data.viability_score.toFixed(0)}/100`}
          color={data.viability_score >= 70 ? 'text-green-600' : data.viability_score >= 40 ? 'text-amber-600' : 'text-red-600'}
          sub="Overall rating"
        />
        <StatCard
          icon={PoundSterling}
          label="Avg Price / m²"
          value={`£${data.market_metrics.avg_price_per_m2.toLocaleString('en-GB')}`}
          sub={`${trendPct >= 0 ? '▲' : '▼'} ${Math.abs(trendPct).toFixed(1)}% (24m)`}
          color={trendPct >= 0 ? 'text-swiss-black' : 'text-red-600'}
        />
        <StatCard
          icon={Zap}
          label="Avg EPC Rating"
          value={data.market_metrics.avg_epc_rating}
          sub={data.location.district}
        />
      </div>

      {/* Map + gauges */}
      <div>
        <SectionHeader title="Location & Scores" subtitle="Geocoded location with ML approval prediction and viability rating" />
        <div className="grid lg:grid-cols-3 gap-6">
          <PlanningMap location={data.location} postcode={data.postcode} />
          <ApprovalProbability probability={data.ml_prediction.approval_probability} />
          <ViabilityScore score={data.viability_score} breakdown={data.viability_breakdown} />
        </div>
      </div>

      {/* AI Report */}
      <div>
        <SectionHeader title="AI Planning Report" subtitle="Strategic analysis generated by Gemini 2.0 Flash" />
        {reportLoading ? (
          <AIReport
            report={{ overall_outlook: '', key_risks: [], strategic_recommendation: '', risk_mitigation: [] }}
            generatedAt=""
            loading={true}
          />
        ) : reportData ? (
          <AIReport report={reportData.report} generatedAt={reportData.generated_at} />
        ) : (
          <div className="swiss-card text-center py-8 opacity-40">
            <p className="text-sm uppercase tracking-wider">Report not available</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function PlanningTab({ data, loading }: { data: AnalyzeResponse | null; loading: boolean }) {
  if (loading && !data) return <div className="space-y-6"><SkeletonCard /><SkeletonCard /></div>
  if (!data) return <EmptyState />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-10">
      <div>
        <SectionHeader title="Regulatory Constraints" subtitle="Planning designations that affect permitted development and application requirements" />
        <ConstraintsPanel constraints={data.constraints} />
      </div>
      <div>
        <SectionHeader title="Local Application Data" subtitle="Historical planning decisions within 500m radius over the past 5 years" />
        <PlanningMetrics metrics={data.planning_metrics} />
      </div>
    </motion.div>
  )
}

function MarketTab({ data, loading }: { data: AnalyzeResponse | null; loading: boolean }) {
  if (loading && !data) return <div className="space-y-6"><SkeletonCard /><SkeletonCard /></div>
  if (!data) return <EmptyState />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-10">
      <div>
        <SectionHeader title="Property Market" subtitle="Land Registry price data and EPC ratings within 500m" />
        <MarketMetrics metrics={data.market_metrics} />
      </div>
      <div>
        <SectionHeader title="Development Feasibility" subtitle="Estimate build cost, value uplift and projected ROI using BCIS industry rates" />
        <BuildCostCalculator avgPricePerM2={data.market_metrics.avg_price_per_m2} />
      </div>
    </motion.div>
  )
}

function SustainabilityTab({ data, loading }: { data: AnalyzeResponse | null; loading: boolean }) {
  if (loading && !data) return <SkeletonCard />
  if (!data) return <EmptyState />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-10">
      <div>
        <SectionHeader title="Solar Potential" subtitle="Estimated photovoltaic generation, bill savings and payback period for this location" />
        <div className="max-w-2xl">
          <SolarPotential lat={data.location.lat} lon={data.location.lon} />
        </div>
      </div>
      <div>
        <SectionHeader title="Energy Performance" subtitle="Average EPC rating for residential properties in this postcode" />
        <div className="bg-white dark:bg-[#111] border-4 border-black dark:border-white/15 p-4 sm:p-8 max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="text-center flex-shrink-0">
              <p className="text-4xl sm:text-6xl font-black">{data.market_metrics.avg_epc_rating}</p>
              <p className="text-xs uppercase tracking-widest opacity-50 mt-1">Avg EPC</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-1 h-5 mb-2">
                {['A','B','C','D','E','F','G'].map(r => {
                  const colors: Record<string,string> = {
                    A:'bg-green-700', B:'bg-green-500', C:'bg-lime-500', D:'bg-amber-400', E:'bg-amber-600', F:'bg-red-500', G:'bg-red-700'
                  }
                  return (
                    <div key={r} className={`flex-1 border border-black/20 dark:border-white/10 ${colors[r]} ${r === data.market_metrics.avg_epc_rating ? 'opacity-100 ring-2 ring-black dark:ring-white' : 'opacity-25'}`} />
                  )
                })}
              </div>
              <div className="flex justify-between text-xs opacity-30"><span>A — Best</span><span>G — Worst</span></div>
              <p className="text-sm opacity-60 mt-3">
                Properties rated C or below may require improvement under upcoming MEES regulations (2028). This affects landlords and development valuations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CommunityTab({ data, loading }: { data: AnalyzeResponse | null; loading: boolean }) {
  if (loading && !data) return <SkeletonCard />
  if (!data) return <EmptyState />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-10">
      <div>
        <SectionHeader title="Nearby Schools" subtitle="Ofsted-rated schools within 0.75 miles — a primary driver of residential property values" />
        <div className="max-w-2xl">
          <SchoolsPanel schools={data.nearby_schools} />
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <MapPin className="w-12 h-12 opacity-10 mb-4" />
      <p className="text-xl font-black uppercase tracking-tighter opacity-20">No analysis loaded</p>
      <p className="text-sm opacity-30 mt-2">Enter a postcode in the sidebar to begin</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null)
  const [reportData, setReportData] = useState<ReportResponse | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)

  // ── Dark mode: persist to localStorage and toggle class ──
  useEffect(() => {
    const stored = localStorage.getItem('planpilot_dark')
    if (stored === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('planpilot_dark', String(next))
      return next
    })
  }

  useEffect(() => {
    setSearchHistory(loadHistory())
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      setToken(session.access_token)

      // ── Auto-analyze from URL params ──
      const urlPostcode = searchParams.get('postcode')
      if (urlPostcode) {
        const params: ProjectParams = {
          application_type: (searchParams.get('application_type') as any) || 'extension',
          property_type: (searchParams.get('property_type') as any) || 'semi_detached',
          num_storeys: parseInt(searchParams.get('num_storeys') || '1') || 1,
          estimated_floor_area_m2: parseInt(searchParams.get('floor_area') || '30') || 30,
        }
        // Kick off the analysis
        handleAnalyzeRef.current?.(urlPostcode.toUpperCase(), params, undefined, session.access_token)
      }
    }
    checkAuth()
  }, [router, searchParams])

  // ── Share link builder ──
  const copyShareLink = () => {
    if (!analyzeData) return
    const url = new URL(window.location.origin + '/dashboard')
    url.searchParams.set('postcode', analyzeData.postcode)
    if (analyzeData.project_params) {
      url.searchParams.set('application_type', analyzeData.project_params.application_type)
      url.searchParams.set('property_type', analyzeData.project_params.property_type)
      url.searchParams.set('num_storeys', String(analyzeData.project_params.num_storeys))
      url.searchParams.set('floor_area', String(analyzeData.project_params.estimated_floor_area_m2))
    }
    navigator.clipboard.writeText(url.toString())
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // ── Ref so URL effect can call handleAnalyze ──
  const handleAnalyzeRef = React.useRef<typeof handleAnalyze | null>(null)

  const handleAnalyze = useCallback(async (postcode: string, params?: ProjectParams, overrides?: ManualOverrides, tokenOverride?: string) => {
    const activeToken = tokenOverride || token
    if (!activeToken) { setError('Not authenticated'); return }

    setLoading(true)
    setReportLoading(true)
    setError(null)
    setAnalyzeData(null)
    setReportData(null)
    setActiveTab('overview')
    setSidebarOpen(false)
    setShowForm(false)

    try {
      const result: AnalyzeResponse = await analyzePostcode(postcode, activeToken, params, overrides)
      setAnalyzeData(result)
      setLoading(false)

      // Persist to history
      const entry: HistoryEntry = {
        postcode: result.postcode,
        timestamp: Date.now(),
        viability_score: Math.round(result.viability_score),
        approval_probability: result.ml_prediction.approval_probability,
      }
      setSearchHistory(pushHistory(entry))

      try {
        const report = await fetchReport(postcode, activeToken)
        setReportData(report)
      } catch (e) {
        console.error('Report failed:', e)
      } finally {
        setReportLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
      setLoading(false)
      setReportLoading(false)
    }
  }, [token])

  // Keep ref in sync so the URL-param effect can call handleAnalyze
  useEffect(() => { handleAnalyzeRef.current = handleAnalyze }, [handleAnalyze])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('planpilot_dark')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-black uppercase tracking-tighter">Loading…</div>
      </div>
    )
  }

  const activeTabMeta = TABS.find(t => t.id === activeTab)!

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#0a0a0a] dark:text-white">

      {/* ── Sidebar (desktop collapsible, mobile overlay) ── */}
      <AnimatePresence>
        {desktopSidebarOpen && (
          <motion.div
            initial={{ marginLeft: -288 }}
            animate={{ marginLeft: 0 }}
            exit={{ marginLeft: -288 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="hidden lg:block no-print flex-shrink-0"
          >
            <Sidebar
              userEmail={user.email}
              onSignOut={handleSignOut}
              onAnalyze={handleAnalyze}
              loading={loading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              hasData={!!analyzeData}
              searchHistory={searchHistory}
              currentPostcode={analyzeData?.postcode}
              onClose={() => setDesktopSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <Sidebar
                userEmail={user.email}
                onSignOut={handleSignOut}
                onAnalyze={handleAnalyze}
                loading={loading}
                activeTab={activeTab}
                setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false) }}
                hasData={!!analyzeData}
                searchHistory={searchHistory}
                currentPostcode={analyzeData?.postcode}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 bg-white dark:bg-[#111] border-b-4 border-black dark:border-white/10 px-3 py-2 sm:px-6 sm:py-4 flex items-center gap-2 sm:gap-4 z-20 no-print">
          {/* Sidebar toggle button */}
          <button
            onClick={() => {
              // On mobile, open the overlay sidebar; on desktop, toggle the collapsible sidebar
              if (window.innerWidth < 1024) {
                setSidebarOpen(true)
              } else {
                setDesktopSidebarOpen(prev => !prev)
              }
            }}
            className="w-10 h-10 border-2 border-black dark:border-white/20 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0">
            {analyzeData ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-swiss-accent flex-shrink-0" />
                  <span className="text-2xl font-black tracking-tighter">{analyzeData.postcode}</span>
                </div>
                <span className="text-black/20 dark:text-white/20 font-black hidden sm:block">·</span>
                <span className="text-sm font-bold opacity-50 hidden sm:block">{analyzeData.location.district}</span>
                <span className="text-black/20 dark:text-white/20 font-black hidden sm:block">·</span>
                <span className="text-sm uppercase tracking-wider font-bold opacity-40 hidden sm:block">{activeTabMeta.label}</span>
              </div>
            ) : (
              <p className="text-sm uppercase tracking-widest font-bold opacity-30">No postcode selected</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="no-print w-9 h-9 border-2 border-black dark:border-white/20 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="no-print flex items-center gap-1.5 border-2 border-black dark:border-white/20 px-3 py-2 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* Compare mode */}
            <button
              onClick={() => { setShowComparison(!showComparison); setShowForm(false) }}
              className={`no-print flex items-center gap-1.5 border-2 px-3 py-2 text-xs uppercase font-bold tracking-wider transition-colors ${
                showComparison
                  ? 'border-swiss-accent bg-swiss-accent text-white'
                  : 'border-black dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            {analyzeData && (
              <>
                {/* Share link */}
                <button
                  onClick={copyShareLink}
                  className="no-print flex items-center gap-1.5 border-2 border-black dark:border-white/20 px-3 py-2 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  title="Copy share link"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden lg:inline">{linkCopied ? 'Copied' : 'Share'}</span>
                </button>

                {/* CSV Export */}
                <button
                  onClick={() => exportToCSV(analyzeData)}
                  className="no-print hidden sm:flex items-center gap-1.5 border-2 border-black dark:border-white/20 px-3 py-2 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  title="Export CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden lg:inline">CSV</span>
                </button>

                {/* Print/PDF */}
                <button
                  onClick={() => window.print()}
                  className="no-print hidden md:flex items-center gap-1.5 border-2 border-black dark:border-white/20 px-3 py-2 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden lg:inline">PDF</span>
                </button>
              </>
            )}

            {/* Profile */}
            <Link
              href="/dashboard/profile"
              className="no-print w-9 h-9 border-2 border-black dark:border-white/20 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              title="Account settings"
            >
              <UserCircle className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex-shrink-0 border-b-4 border-swiss-accent bg-swiss-accent/10 px-6 py-3 flex items-center gap-3 no-print"
            >
              <AlertCircle className="w-5 h-5 text-swiss-accent flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4 opacity-60 hover:opacity-100" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile tab navigation */}
        {analyzeData && (
          <div className="flex-shrink-0 lg:hidden border-b-2 border-black/10 bg-white dark:bg-[#111] overflow-x-auto no-print">
            <div className="flex">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-swiss-accent text-swiss-accent'
                        : 'border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">

            {/* Comparison mode view */}
            {showComparison && token && (
              <div className="mb-8">
                <ComparisonMode token={token} initialData={analyzeData ?? undefined} />
                <button
                  onClick={() => setShowComparison(false)}
                  className="mt-4 text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
                >
                  &larr; Back to single view
                </button>
              </div>
            )}

            {/* Show PostcodeInput form when no data or user clicked New Analysis */}
            {!showComparison && (showForm || !analyzeData) && (
              <div className="mb-8">
                <PostcodeInput onAnalyze={handleAnalyze} loading={loading} token={token ?? undefined} />
                {analyzeData && (
                  <button
                    onClick={() => setShowForm(false)}
                    className="mt-4 text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
                  >
                    &larr; Back to results
                  </button>
                )}
              </div>
            )}

            {/* Show results when data is loaded and form is hidden */}
            {analyzeData && !showForm && !showComparison && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'overview' && (
                    <OverviewTab data={analyzeData} reportData={reportData} reportLoading={reportLoading} loading={loading} />
                  )}
                  {activeTab === 'planning' && (
                    <PlanningTab data={analyzeData} loading={loading} />
                  )}
                  {activeTab === 'market' && (
                    <MarketTab data={analyzeData} loading={loading} />
                  )}
                  {activeTab === 'sustainability' && (
                    <SustainabilityTab data={analyzeData} loading={loading} />
                  )}
                  {activeTab === 'community' && (
                    <CommunityTab data={analyzeData} loading={loading} />
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Empty state only when no data and not showing form (shouldn't happen but fallback) */}
            {!analyzeData && !showForm && !showComparison && !loading && <EmptyState />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-black uppercase tracking-tighter">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}