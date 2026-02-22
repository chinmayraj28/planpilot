'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  ArrowRight, Map, TrendingUp, AlertTriangle, FileText, Activity, Shield,
  Search, Database, Brain, BarChart2, Zap, ChevronRight, Settings2, Layers,
} from 'lucide-react'

/* ── Animated counter hook ── */
function useCountUp(target: number, duration = 2000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(id) }
      else setVal(Math.round(start))
    }, 16)
    return () => clearInterval(id)
  }, [target, duration])
  return val
}

/* ── Pipeline step data ── */
const PIPELINE = [
  {
    icon: Search,
    title: 'POSTCODE INPUT',
    desc: 'User enters any UK postcode + optional project details',
    color: 'bg-blue-500',
    detail: 'Supports all UK postcode formats. Optional: application type, property type, storeys, floor area.',
  },
  {
    icon: Database,
    title: 'DATA FETCH',
    desc: '4 parallel queries hit our enriched Supabase database',
    color: 'bg-emerald-500',
    detail: 'Geocoding → Constraints (flood, conservation, greenbelt, Article 4) → Planning history (500m radius) → Market data (Price Paid, EPC)',
  },
  {
    icon: Brain,
    title: 'ML PREDICTION',
    desc: 'XGBoost model + heuristic adjustments for project specifics',
    color: 'bg-purple-500',
    detail: '10 location features fed to a trained XGBoost classifier. Project parameters applied as post-hoc risk multipliers.',
  },
  {
    icon: BarChart2,
    title: 'VIABILITY SCORING',
    desc: 'Constraint penalties, market bonuses, project complexity',
    color: 'bg-amber-500',
    detail: '0–100 composite score with full breakdown: base score, constraint penalty, flood penalty, market strength bonus, project complexity.',
  },
  {
    icon: Zap,
    title: 'AI REPORT',
    desc: 'Gemini 2.0 Flash generates strategic planning advice',
    color: 'bg-swiss-accent',
    detail: 'Full context prompt including constraints, metrics, and project params. Returns key risks, strategic recommendations, and mitigation steps.',
  },
]

export default function LandingPage() {
  const [user, setUser] = useState<any>(null)
  const [activePipelineStep, setActivePipelineStep] = useState(0)

  // Landing page is always light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Auto-advance pipeline demo
  useEffect(() => {
    const id = setInterval(() => {
      setActivePipelineStep(s => (s + 1) % PIPELINE.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const features = [
    { icon: Map, label: 'Location Analysis', description: 'Instant mapping and geographic context for any UK postcode' },
    { icon: AlertTriangle, label: 'Constraint Flagging', description: 'Flood zones, conservation areas, greenbelt, and Article 4 restrictions' },
    { icon: TrendingUp, label: 'Market Metrics', description: 'Price trends, EPC ratings, and local property market intelligence' },
    { icon: Activity, label: 'Approval Probability', description: 'ML-powered prediction based on historical planning decisions' },
    { icon: Shield, label: 'Viability Scoring', description: 'Comprehensive 0–100 score with detailed breakdown of penalties and bonuses' },
    { icon: FileText, label: 'AI Planning Report', description: 'Strategic recommendations and risk mitigation from Gemini 2.0' },
    { icon: Settings2, label: 'Manual Overrides', description: 'Optionally override any auto-fetched value with your own site knowledge' },
    { icon: Layers, label: 'Project Personalisation', description: 'Application type, property type, storeys, and floor area affect predictions' },
  ]

  const postcodeCount = useCountUp(36000, 2500)
  const featureCount = useCountUp(10, 1500)
  const dataSourceCount = useCountUp(7, 1800)

  return (
    <main className="min-h-screen bg-swiss-white">
      {/* ══════════ Header ══════════ */}
      <header className="border-b-4 border-swiss-black bg-swiss-white sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-swiss-accent" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter">PLANPILOT AI</h1>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2.5 border-2 border-black/10 px-3 py-1.5 mr-1">
                  <div className="w-6 h-6 bg-swiss-accent/10 border border-swiss-accent/30 flex items-center justify-center">
                    <span className="text-xs font-black text-swiss-accent">{user.email?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-bold tracking-wide text-black/50 max-w-[160px] truncate">{user.email}</span>
                </div>
                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-swiss-black text-white px-4 py-2.5 sm:px-5 text-xs font-black uppercase tracking-widest hover:bg-swiss-accent transition-colors">
                  Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 border-2 border-swiss-black px-4 py-2.5 sm:px-5 text-xs font-black uppercase tracking-widest hover:bg-swiss-black hover:text-white transition-colors">
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </motion.div>
        </div>
      </header>

      {/* ══════════ Hero ══════════ */}
      <section className="border-b-4 border-swiss-black relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-8 py-10 md:py-28 grid md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Left: Copy */}
          <div className="md:col-span-6 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-5 text-swiss-accent">
                UK Planning Intelligence Platform
              </p>
              <h2 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6 md:mb-8">
                KNOW BEFORE
                <br />
                YOU
                <br />
                <span className="text-swiss-accent">APPLY</span>
              </h2>
              <p className="text-sm sm:text-base md:text-xl max-w-xl mb-6 md:mb-10 leading-relaxed opacity-80">
                Enter any UK postcode. Get constraint data, flood risk, approval probability,
                viability scoring, and AI-generated strategic advice — personalised to your
                specific project — in seconds.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link href={user ? '/dashboard' : '/login'} className="swiss-btn-primary inline-flex items-center gap-2 group !px-5 !py-3 sm:!px-8 sm:!py-4">
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                  <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                </Link>
                <a href="#how-it-works" className="swiss-btn-secondary inline-flex items-center gap-2 !px-5 !py-3 sm:!px-8 sm:!py-4">
                  <span className="hidden xs:inline">See How It Works</span>
                  <span className="xs:hidden">How It Works</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right: Animated pipeline preview */}
          <div className="md:col-span-6 relative overflow-hidden md:overflow-visible">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Mock UI card */}
              <div className="border-4 border-swiss-black bg-white p-4 md:p-8 relative">
                {/* Fake postcode bar */}
                <div className="flex items-center gap-2 sm:gap-3 border-4 border-swiss-black px-3 sm:px-5 py-3 sm:py-4 mb-4 sm:mb-6">
                  <Search className="w-5 h-5 opacity-40" />
                  <motion.div
                    key={activePipelineStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-xl font-black tracking-wider"
                  >
                    SW1A 1AA
                  </motion.div>
                  <div className="ml-auto bg-swiss-accent text-white px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                    Analyze
                  </div>
                </div>

                {/* Pipeline steps as animated progress */}
                <div className="space-y-3">
                  {PIPELINE.map((step, i) => {
                    const Icon = step.icon
                    const isActive = i === activePipelineStep
                    const isDone = i < activePipelineStep

                    return (
                      <motion.div
                        key={step.title}
                        initial={false}
                        animate={{
                          backgroundColor: isActive ? 'rgba(255,48,0,0.05)' : isDone ? 'rgba(0,0,0,0.02)' : 'transparent',
                          borderColor: isActive ? '#FF3000' : isDone ? '#000' : 'rgba(0,0,0,0.1)',
                        }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 border-l-4 cursor-pointer"
                        onClick={() => setActivePipelineStep(i)}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-swiss-accent text-white' : isDone ? 'bg-black text-white' : 'bg-black/5'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-swiss-accent' : isDone ? '' : 'opacity-40'}`}>{step.title}</p>
                          <p className="text-[11px] opacity-60 truncate">{step.desc}</p>
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-swiss-accent rounded-full flex-shrink-0"
                          />
                        )}
                        {isDone && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-black rounded-full flex-shrink-0"
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Detail panel for active step */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePipelineStep}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="bg-black text-white p-3 sm:p-4 text-xs leading-relaxed font-mono break-words overflow-hidden">
                      <span className="text-swiss-accent font-bold">{'>'} </span>
                      {PIPELINE[activePipelineStep].detail}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Decorative elements — hidden on mobile to prevent overflow */}
              <motion.div
                className="hidden sm:block absolute -top-4 -right-4 w-16 h-16 bg-swiss-accent"
                animate={{ rotate: [0, 90, 90, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="hidden sm:block absolute -bottom-3 -left-3 w-10 h-10 border-4 border-swiss-black"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ Stats strip ══════════ */}
      <section className="border-b-4 border-swiss-black bg-swiss-black text-white">
        <div className="container mx-auto px-4 sm:px-8 py-6 md:py-10">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-2xl sm:text-4xl md:text-5xl font-black">{postcodeCount.toLocaleString()}+</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest opacity-50 mt-1 sm:mt-2">Planning Applications Trained</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <p className="text-2xl sm:text-4xl md:text-5xl font-black">{featureCount}</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest opacity-50 mt-1 sm:mt-2">ML Features Per Prediction</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <p className="text-2xl sm:text-4xl md:text-5xl font-black">{dataSourceCount}</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest opacity-50 mt-1 sm:mt-2">Government Data Sources</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ How It Works — full pipeline ══════════ */}
      <section id="how-it-works" className="border-b-4 border-swiss-black scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-8 py-12 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-5 text-swiss-accent">
              How It Works
            </p>
            <h3 className="text-4xl md:text-7xl font-black tracking-tighter mb-4 md:mb-6">
              THE FULL
              <br />
              PIPELINE
            </h3>
            <p className="text-base md:text-lg opacity-70 max-w-2xl mb-8 md:mb-16">
              From postcode to actionable intelligence in under 5 seconds. Every step is transparent
              — and every data point can be manually overridden if you have better local knowledge.
            </p>
          </motion.div>

          {/* Pipeline timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-1 bg-black/10" />

            <div className="space-y-0">
              {PIPELINE.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="grid md:grid-cols-12 gap-4 md:gap-8 group"
                  >
                    {/* Step number + icon */}
                    <div className="md:col-span-1 flex md:flex-col items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-14 h-14 md:w-20 md:h-20 ${step.color} text-white flex items-center justify-center relative z-10 flex-shrink-0`}
                      >
                        <Icon className="w-6 h-6 md:w-8 md:h-8" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-11 border-4 border-swiss-black p-4 md:p-8 bg-white group-hover:bg-swiss-accent group-hover:text-white transition-all duration-200 mb-4 md:mb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black tracking-widest opacity-40 mb-2">STEP {String(i + 1).padStart(2, '0')}</p>
                          <h4 className="text-xl md:text-3xl font-black tracking-tighter mb-2 md:mb-3">{step.title}</h4>
                          <p className="text-sm md:text-base leading-relaxed opacity-80">{step.desc}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t-2 border-current/10">
                        <p className="text-xs md:text-sm font-mono opacity-60 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Personalisation callout ══════════ */}
      <section className="border-b-4 border-swiss-black bg-swiss-accent text-white overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-8 py-10 md:py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-xs tracking-widest uppercase font-bold opacity-60 mb-4">New Feature</p>
              <h3 className="text-3xl md:text-6xl font-black tracking-tighter mb-4 md:mb-6">
                YOUR PROJECT.
                <br />
                YOUR DATA.
              </h3>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed opacity-90 mb-6 md:mb-8">
                PlanPilot doesn't just do generic location lookups. Tell us your application type,
                property type, floor area — and optionally override <em>any</em> of the 10 model
                features with your own values. The prediction adapts to your exact scenario.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Extension', 'New Build', 'Loft Conversion', 'Change of Use', 'Listed Building', 'Demolition'].map((t, i) => (
                  <motion.span
                    key={t}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="border-2 border-white/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 border-2 border-white/20 p-6"
            >
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">Manual Override Example</p>
              <div className="space-y-3">
                {[
                  { label: 'Flood Zone', val: '1', status: 'auto' },
                  { label: 'Conservation Area', val: 'Yes', status: 'override' },
                  { label: 'Green Belt', val: 'No', status: 'auto' },
                  { label: 'Local Approval Rate', val: '0.78', status: 'auto' },
                  { label: 'Avg Price / m²', val: '£5,200', status: 'override' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center justify-between py-2 border-b border-white/10"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black">{item.val}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                        item.status === 'override' ? 'bg-white text-swiss-accent' : 'bg-white/10'
                      }`}>{item.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 border-[40px] border-white/5"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </section>

      {/* ══════════ Features Grid ══════════ */}
      <section className="border-b-4 border-swiss-black bg-swiss-muted swiss-diagonal">
        <div className="container mx-auto px-4 sm:px-8 py-12 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-5 text-swiss-accent">
              Core Capabilities
            </p>
            <h3 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-16">
              COMPREHENSIVE
              <br />
              INTELLIGENCE
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="swiss-card-hover group cursor-pointer"
              >
                <feature.icon className="w-10 h-10 mb-5 stroke-[2.5px]" />
                <h4 className="text-base font-bold uppercase tracking-tight mb-2">{feature.label}</h4>
                <p className="text-sm leading-relaxed opacity-80">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ Data Sources ══════════ */}
      <section className="border-b-4 border-swiss-black">
        <div className="container mx-auto px-4 sm:px-8 py-12 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-5 text-swiss-accent">
                Data Sources
              </p>
              <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 md:mb-6">
                BUILT ON
                <br />
                REAL DATA
              </h3>
              <p className="text-lg opacity-70 leading-relaxed">
                Every prediction is grounded in official UK government datasets — not guesswork.
                We ingest, geocode, and spatially index millions of records so you don't have to.
              </p>
            </motion.div>

            <div className="space-y-3">
              {[
                { name: 'IBEX Planning Applications', desc: '36k+ historical decisions with lat/lon' },
                { name: 'Environment Agency Flood Zones', desc: 'Zone 1, 2, 3 polygons (GeoJSON)' },
                { name: 'Historic England Conservation Areas', desc: 'Conservation area boundaries' },
                { name: 'Ministry of Housing Green Belt', desc: 'National greenbelt polygons' },
                { name: 'Article 4 Directions', desc: 'Restricted permitted development areas' },
                { name: 'HM Land Registry Price Paid', desc: '4.6M+ property transactions' },
                { name: 'EPC Register', desc: 'Energy performance ratings A–G' },
              ].map((src, i) => (
                <motion.div
                  key={src.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 sm:gap-4 border-4 border-black p-3 sm:p-5 bg-white hover:bg-black hover:text-white transition-all duration-200 group"
                >
                  <div className="w-6 h-6 bg-swiss-accent flex-shrink-0 mt-0.5 group-hover:bg-white transition-colors" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{src.name}</p>
                    <p className="text-xs opacity-60 mt-1">{src.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="bg-swiss-black text-swiss-white">
        <div className="container mx-auto px-4 sm:px-8 py-12 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h3 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 md:mb-8">
              READY TO START?
            </h3>
            <p className="text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto opacity-90">
              Sign in to access the full PlanPilot AI platform and start analyzing properties with confidence.
            </p>
            <Link
              href={user ? '/dashboard' : '/login'}
              className="inline-block border-4 border-swiss-white bg-swiss-white text-swiss-black uppercase font-bold tracking-widest transition-all duration-150 ease-linear px-6 py-4 sm:px-12 sm:py-6 text-sm hover:bg-swiss-accent hover:border-swiss-accent hover:text-swiss-white"
            >
              {user ? 'Go to Dashboard' : 'Access Platform'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════ Footer ══════════ */}
      <footer className="border-t-4 border-swiss-black bg-swiss-muted">
        <div className="container mx-auto px-4 sm:px-8 py-8 md:py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-black tracking-tighter mb-4">PLANPILOT AI</h4>
              <p className="text-sm opacity-70 leading-relaxed">
                UK Planning Intelligence Platform
              </p>
            </div>
            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider mb-4">Platform</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-swiss-accent transition-colors">Sign In</Link></li>
                <li><Link href="/dashboard" className="hover:text-swiss-accent transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-swiss-accent transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-swiss-accent transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t-2 border-swiss-black">
            <p className="text-xs uppercase tracking-wider opacity-60 text-center">
              © 2026 PlanPilot AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
