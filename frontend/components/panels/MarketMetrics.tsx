'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { TrendingUp, TrendingDown, PoundSterling, Zap } from 'lucide-react'

interface MarketMetricsProps {
  metrics: {
    avg_price_per_m2: number
    price_trend_24m: number
    avg_epc_rating: string
  }
}

const epcColors: { [key: string]: string } = {
  A: 'bg-green-700 border-green-900 text-white',
  B: 'bg-green-500 border-green-700 text-white',
  C: 'bg-green-300 border-green-500 text-black',
  D: 'bg-amber-300 border-amber-500 text-black',
  E: 'bg-amber-500 border-amber-700 text-white',
  F: 'bg-red-500 border-red-700 text-white',
  G: 'bg-red-700 border-red-900 text-white',
}

export function MarketMetrics({ metrics }: MarketMetricsProps) {
  const trendPercentage = (metrics.price_trend_24m * 100).toFixed(1)
  const isPositiveTrend = metrics.price_trend_24m >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="swiss-card swiss-diagonal"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">
          Market Metrics
        </h3>
        <InfoTooltip text="Local property market data including prices, trends, and energy efficiency." />
      </div>

      <div className="space-y-6">
        {/* Price per m² */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <PoundSterling className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                Avg Price per m²
              </span>
              <InfoTooltip text="Average property sale price per square meter in this postcode area over the past 12 months." />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">
                £{metrics.avg_price_per_m2.toLocaleString('en-GB')}
              </span>
              <span className="text-sm opacity-60">/m²</span>
            </div>
          </div>
        </div>

        {/* Price Trend */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            {isPositiveTrend ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                24-Month Trend
              </span>
              <InfoTooltip text="Percentage change in average property prices over the past 24 months." />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-black ${
                  isPositiveTrend ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositiveTrend ? '+' : ''}{trendPercentage}%
              </span>
              <span className="text-sm opacity-60">
                {isPositiveTrend ? 'growth' : 'decline'}
              </span>
            </div>
          </div>
        </div>

        {/* EPC Rating */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border-4 border-swiss-black flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                Avg EPC Rating
              </span>
              <InfoTooltip text="Average Energy Performance Certificate rating for properties in this area. A (best) to G (worst)." />
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`inline-block px-6 py-3 border-4 text-3xl font-black ${
                  epcColors[metrics.avg_epc_rating] || 'bg-gray-300 border-gray-500'
                }`}
              >
                {metrics.avg_epc_rating}
              </span>
              <span className="text-sm opacity-60">
                {metrics.avg_epc_rating <= 'C' ? 'Good efficiency' : metrics.avg_epc_rating <= 'E' ? 'Moderate efficiency' : 'Poor efficiency'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
