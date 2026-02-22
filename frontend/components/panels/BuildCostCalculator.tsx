'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Calculator, TrendingUp, Hammer } from 'lucide-react'

interface BuildCostCalculatorProps {
  avgPricePerM2: number
}

const DEV_TYPES = [
  { id: 'extension',   label: 'Single-Storey Extension', rate: 2500 },
  { id: 'loft',        label: 'Loft Conversion',         rate: 2000 },
  { id: 'newbuild',    label: 'New Build',                rate: 3500 },
  { id: 'garage',      label: 'Garage Conversion',        rate: 1500 },
  { id: 'basement',    label: 'Basement',                 rate: 4000 },
] as const

// Typical value uplift: an extension adds ~85% of the new space value
const VALUE_EFFICIENCY = 0.85

export function BuildCostCalculator({ avgPricePerM2 }: BuildCostCalculatorProps) {
  const [devType, setDevType] = useState<string>('extension')
  const [sizeM2, setSizeM2] = useState<number>(30)

  const selected = DEV_TYPES.find(d => d.id === devType) ?? DEV_TYPES[0]
  const buildCost = selected.rate * sizeM2
  const valueAdded = avgPricePerM2 * VALUE_EFFICIENCY * sizeM2
  const profit = valueAdded - buildCost
  const roi = buildCost > 0 ? (profit / buildCost) * 100 : 0

  const profitPositive = profit >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="swiss-card"
    >
      <div className="flex items-start justify-between mb-4 sm:mb-8">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">Build Cost Calculator</h3>
          <p className="text-xs opacity-50 mt-1">Source: BCIS industry average rates (assumptions baked in)</p>
        </div>
        <InfoTooltip text="Estimates construction costs using BCIS industry average rates. Value uplift assumes 85% of added space translates to resale value." />
      </div>

      <div className="space-y-6">
        {/* Development Type */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hammer className="w-4 h-4 opacity-60" />
            <span className="text-xs uppercase tracking-widest font-bold opacity-60">Development Type</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {DEV_TYPES.map(dt => (
              <button
                key={dt.id}
                onClick={() => setDevType(dt.id)}
                className={`flex items-center justify-between px-4 py-3 border-2 text-left transition-colors ${
                  devType === dt.id
                    ? 'border-swiss-black bg-swiss-black text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-swiss-black/30 hover:border-swiss-black dark:border-white/20 dark:hover:border-white'
                }`}
              >
                <span className="text-sm font-bold">{dt.label}</span>
                <span className="text-xs opacity-60">£{dt.rate.toLocaleString('en-GB')}/m²</span>
              </button>
            ))}
          </div>
        </div>

        {/* Size Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Floor Area</span>
              <InfoTooltip text="Total new floor area being added or built." />
            </div>
            <span className="text-2xl font-black">{sizeM2} m²</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={sizeM2}
            onChange={e => setSizeM2(Number(e.target.value))}
            className="w-full accent-swiss-black dark:accent-white h-2 cursor-pointer"
          />
          <div className="flex justify-between text-xs opacity-30 mt-1">
            <span>10 m²</span>
            <span>200 m²</span>
          </div>
        </div>

        {/* Results */}
        <div className="border-t-4 border-swiss-black dark:border-white/20 pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-swiss-black/30 dark:border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest font-bold opacity-60 mb-1">Build Cost</p>
              <p className="text-xl sm:text-2xl font-black text-red-600">£{buildCost.toLocaleString('en-GB')}</p>
              <p className="text-xs opacity-40 mt-1">@ £{selected.rate.toLocaleString('en-GB')}/m²</p>
            </div>
            <div className="border-2 border-swiss-black/30 dark:border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest font-bold opacity-60 mb-1">Value Added</p>
              <p className="text-xl sm:text-2xl font-black text-green-600">£{Math.round(valueAdded).toLocaleString('en-GB')}</p>
              <p className="text-xs opacity-40 mt-1">@ £{avgPricePerM2.toLocaleString('en-GB')}/m² × 85%</p>
            </div>
          </div>

          <div className="border-4 border-swiss-black dark:border-white/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-6 h-6 ${profitPositive ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-xs uppercase tracking-widest font-bold opacity-60">Projected Profit</p>
                <p className={`text-2xl sm:text-3xl font-black ${profitPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {profitPositive ? '+' : ''}£{Math.round(profit).toLocaleString('en-GB')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest font-bold opacity-60">ROI</p>
              <p className={`text-2xl sm:text-3xl font-black ${profitPositive ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(0)}%
              </p>
            </div>
          </div>

          <p className="text-xs opacity-30 leading-relaxed">
            Estimates based on BCIS industry averages. Actual costs vary by location, specification, and contractor. Professional QS advice recommended.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
