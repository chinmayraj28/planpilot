'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { TrendingUp, TrendingDown, PoundSterling, Zap, AlertTriangle, Home } from 'lucide-react'

interface MarketMetricsProps {
  metrics: {
    avg_price_per_m2: number
    price_trend_24m: number
    avg_epc_rating: string
    comparable_sales: Array<{
      postcode: string
      price: number
      sale_date: string
    }>
  }
}

const epcConfig: Record<string, { bar: string; label: string }> = {
  A: { bar: 'bg-green-700', label: 'Excellent' },
  B: { bar: 'bg-green-500', label: 'Very Good' },
  C: { bar: 'bg-lime-500', label: 'Good' },
  D: { bar: 'bg-amber-400', label: 'Average' },
  E: { bar: 'bg-amber-600', label: 'Below Average' },
  F: { bar: 'bg-red-500', label: 'Poor' },
  G: { bar: 'bg-red-700', label: 'Very Poor' },
}

const epcWidth: Record<string, string> = {
  A: 'w-full', B: 'w-5/6', C: 'w-4/6', D: 'w-3/6', E: 'w-2/6', F: 'w-1.5/6', G: 'w-1/6',
}

export function MarketMetrics({ metrics }: MarketMetricsProps) {
  const trendPct = metrics.price_trend_24m * 100
  const isPositive = metrics.price_trend_24m >= 0
  const isAnomaly = Math.abs(trendPct) > 30
  const epc = epcConfig[metrics.avg_epc_rating]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="swiss-card swiss-diagonal"
    >
      <div className="flex items-start justify-between mb-4 sm:mb-8">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">Market Metrics</h3>
          <p className="text-xs opacity-50 mt-1">
            Source: HM Land Registry Price Paid Data + DLUHC EPC API
          </p>
        </div>
        <InfoTooltip text="Local property market data including prices, trends, and energy efficiency ratings." />
      </div>

      <div className="space-y-6">
        {/* Price per m² */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0">
            <PoundSterling className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Avg Price per m²</span>
              <InfoTooltip text="Average residential sale price per square metre from Land Registry data within this postcode area." />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black">£{metrics.avg_price_per_m2.toLocaleString('en-GB')}</span>
              <span className="text-sm opacity-60">/m²</span>
            </div>
          </div>
        </div>

        {/* Price Trend */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0">
            {isPositive
              ? <TrendingUp className="w-6 h-6 text-green-600" />
              : <TrendingDown className="w-6 h-6 text-red-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">24-Month Trend</span>
              <InfoTooltip text="Percentage change in average sale prices over the past 24 months." />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-4xl font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{trendPct.toFixed(1)}%
              </span>
              <span className="text-sm opacity-60">{isPositive ? 'growth' : 'decline'}</span>
            </div>
            {isAnomaly && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs">Extreme value — may reflect limited sample size</span>
              </div>
            )}
          </div>
        </div>

        {/* EPC Rating */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Avg EPC Rating</span>
              <InfoTooltip text="Average Energy Performance Certificate rating for residential properties in this area. A (best) to G (worst)." />
            </div>
            {metrics.avg_epc_rating === 'N/A' ? (
              <div>
                <span className="text-2xl font-black opacity-40">N/A</span>
                <p className="text-xs opacity-40 mt-1">No residential EPC data — likely commercial area</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl sm:text-4xl font-black">{metrics.avg_epc_rating}</span>
                  <span className="text-sm opacity-60">{epc?.label}</span>
                </div>
                <div className="flex gap-1 h-3">
                  {['A','B','C','D','E','F','G'].map(r => (
                    <div
                      key={r}
                      className={`flex-1 border border-swiss-black/20 dark:border-white/10 ${epcConfig[r]?.bar} ${r === metrics.avg_epc_rating ? 'opacity-100 ring-2 ring-swiss-black dark:ring-white' : 'opacity-30'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs opacity-30 mt-1">
                  <span>A</span><span>G</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Comparable Sales */}
        {metrics.comparable_sales && metrics.comparable_sales.length > 0 && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-widest font-bold opacity-60">Recent Comparable Sales</span>
                <InfoTooltip text="5 most recent property sales within 500m from Land Registry data." />
              </div>
              <div className="space-y-2">
                {metrics.comparable_sales.map((sale, i) => (
                  <div key={i} className="flex items-center justify-between border border-swiss-black/20 dark:border-white/10 px-3 py-2">
                    <div>
                      <span className="text-sm font-bold">{sale.postcode}</span>
                      <span className="text-xs opacity-40 ml-2">{new Date(sale.sale_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className="text-sm font-black">£{sale.price.toLocaleString('en-GB')}</span>
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
