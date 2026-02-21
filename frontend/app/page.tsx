'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Map, TrendingUp, AlertTriangle, FileText, Activity, Shield } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Map,
      label: 'Location Analysis',
      description: 'Instant mapping and geographic context for any UK postcode',
    },
    {
      icon: AlertTriangle,
      label: 'Constraint Flagging',
      description: 'Flood zones, conservation areas, greenbelt, and Article 4 restrictions',
    },
    {
      icon: TrendingUp,
      label: 'Market Metrics',
      description: 'Price trends, EPC ratings, and local property market intelligence',
    },
    {
      icon: Activity,
      label: 'Approval Probability',
      description: 'ML-powered prediction based on historical planning decisions',
    },
    {
      icon: Shield,
      label: 'Viability Scoring',
      description: 'Comprehensive 0-100 score with detailed breakdown of penalties and bonuses',
    },
    {
      icon: FileText,
      label: 'AI Planning Report',
      description: 'Strategic recommendations and risk mitigation from Gemini 2.0',
    },
  ]

  const howItWorks = [
    { number: '01', text: 'Enter a UK postcode' },
    { number: '02', text: 'AI analyzes planning data' },
    { number: '03', text: 'Get instant intelligence' },
  ]

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b-4 border-swiss-black bg-swiss-white">
        <div className="container mx-auto px-8 py-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter">PLANPILOT AI</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Link href="/login" className="swiss-btn-secondary inline-block">
              Sign In
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b-4 border-swiss-black relative overflow-hidden">
        <div className="container mx-auto px-8 py-24 md:py-32 grid md:grid-cols-12 gap-12 items-center">
          {/* Left: Text */}
          <div className="md:col-span-7 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-6 text-swiss-accent">
                01. UK Planning Intelligence
              </p>
              <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8">
                INSTANT
                <br />
                PLANNING
                <br />
                ANALYSIS
              </h2>
              <p className="text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
                Enter any UK postcode and receive comprehensive planning constraint data,
                flood risk assessment, approval probability, viability scoring, and
                AI-generated strategic recommendations—all in seconds.
              </p>
              <Link href="/login" className="swiss-btn-primary inline-flex items-center gap-2 group">
                Get Started
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Right: Geometric Composition */}
          <div className="md:col-span-5 relative h-[400px] md:h-[600px]">
            {/* Large Circle */}
            <motion.div
              className="absolute top-1/4 right-1/4 w-64 h-64 border-4 border-swiss-black swiss-grid-pattern"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            {/* Red Square */}
            <motion.div
              className="absolute top-1/2 right-1/3 w-32 h-32 bg-swiss-accent"
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            />

            {/* Black Rectangle */}
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-48 h-24 bg-swiss-black swiss-dots"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            />

            {/* Small Circle */}
            <motion.div
              className="absolute top-1/3 right-1/2 w-16 h-16 border-4 border-swiss-accent"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            />

            {/* Diagonal Line */}
            <motion.div
              className="absolute top-0 right-0 w-1 h-full bg-swiss-black origin-top"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b-4 border-swiss-black bg-swiss-muted swiss-diagonal">
        <div className="container mx-auto px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-6 text-swiss-accent">
              02. Core Capabilities
            </p>
            <h3 className="text-5xl md:text-7xl font-black tracking-tighter mb-16">
              COMPREHENSIVE
              <br />
              INTELLIGENCE
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="swiss-card-hover group cursor-pointer"
              >
                <feature.icon className="w-12 h-12 mb-6 stroke-[3px]" />
                <h4 className="text-xl font-bold uppercase tracking-tight mb-3">
                  {feature.label}
                </h4>
                <p className="leading-relaxed opacity-80">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-4 border-swiss-black">
        <div className="container mx-auto px-8 py-24">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-6 text-swiss-accent">
                  03. Simple Process
                </p>
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter">
                  THREE
                  <br />
                  STEPS TO
                  <br />
                  CLARITY
                </h3>
              </motion.div>
            </div>

            <div className="md:col-span-7 space-y-8">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-8 border-4 border-swiss-black p-8 bg-swiss-white hover:bg-swiss-accent hover:text-swiss-white transition-all duration-200 group"
                >
                  <span className="text-6xl font-black text-swiss-accent group-hover:text-swiss-white">
                    {step.number}
                  </span>
                  <p className="text-2xl font-bold uppercase tracking-tight">
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-swiss-black text-swiss-white">
        <div className="container mx-auto px-8 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
              READY TO START?
            </h3>
            <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
              Sign in to access the full PlanPilot AI platform and start analyzing properties with confidence.
            </p>
            <Link
              href="/login"
              className="inline-block border-4 border-swiss-white bg-swiss-white text-swiss-black uppercase font-bold tracking-widest transition-all duration-150 ease-linear px-12 py-6 text-sm hover:bg-swiss-accent hover:border-swiss-accent hover:text-swiss-white"
            >
              Access Platform
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-swiss-black bg-swiss-muted">
        <div className="container mx-auto px-8 py-12">
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
