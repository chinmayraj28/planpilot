'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Sun, Zap, PoundSterling, Clock } from 'lucide-react'

interface SolarPotentialProps {
  lat: number
  lon: number
}

// UK energy rates (Ofgem, 2024)
const UNIT_RATE_GBP    = 0.245   // £/kWh saved on bill
const SEG_RATE_GBP     = 0.075   // £/kWh export via Smart Export Guarantee
const EXPORT_FRACTION  = 0.5     // assume 50% exported
const INSTALL_COST_GBP = 7000    // typical 4kWp system fully installed
const SYSTEM_KWP       = 4       // kWp peak power

function fallbackGeneration(lat: number): number {
  // Simple UK irradiance model: south England ~1100 kWh/kWp/yr, north Scotland ~850
  // Linear interpolation between lat 50 (south) and lat 59 (north)
  const irradiance = Math.max(850, 1100 - (lat - 50) * 28)
  return irradiance * SYSTEM_KWP
}

export function SolarPotential({ lat, lon }: SolarPotentialProps) {
  const [annualKwh, setAnnualKwh] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'pvgis' | 'estimate'>('estimate')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const fetchPVGIS = async () => {
      try {
        const url =
          `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc` +
          `?lat=${lat}&lon=${lon}&peakpower=${SYSTEM_KWP}&loss=14&outputformat=json`
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) throw new Error('PVGIS non-200')
        const data = await res.json()
        const yearly = data?.outputs?.totals?.fixed?.E_y
        if (typeof yearly === 'number' && !cancelled) {
          setAnnualKwh(yearly)
          setSource('pvgis')
        } else {
          throw new Error('No E_y field')
        }
      } catch {
        if (!cancelled) {
          setAnnualKwh(fallbackGeneration(lat))
          setSource('estimate')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPVGIS()
    return () => { cancelled = true }
  }, [lat, lon])

  const selfUseKwh   = annualKwh !== null ? annualKwh * (1 - EXPORT_FRACTION) : 0
  const exportKwh    = annualKwh !== null ? annualKwh * EXPORT_FRACTION : 0
  const billSaving   = selfUseKwh * UNIT_RATE_GBP
  const segIncome    = exportKwh * SEG_RATE_GBP
  const totalAnnual  = billSaving + segIncome
  const paybackYears = totalAnnual > 0 ? INSTALL_COST_GBP / totalAnnual : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="swiss-card swiss-diagonal"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">Solar Potential</h3>
        <InfoTooltip text={`Estimates for a ${SYSTEM_KWP}kWp south-facing PV system. ${source === 'pvgis' ? 'Data from EU PVGIS.' : 'EU PVGIS unavailable — UK latitude estimate used.'}`} />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-swiss-muted border-2 border-swiss-black/10 dark:border-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Annual Generation */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0 bg-amber-50 dark:bg-amber-900/30">
              <Sun className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest font-bold opacity-60">Annual Generation</span>
                <InfoTooltip text={`Estimated annual output for a ${SYSTEM_KWP}kWp system at this location.`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-4xl font-black">{Math.round(annualKwh ?? 0).toLocaleString('en-GB')}</span>
                <span className="text-sm opacity-60">kWh/year</span>
              </div>
              {source === 'estimate' && (
                <p className="text-xs opacity-40 mt-1">Latitude-based estimate (PVGIS unavailable)</p>
              )}
            </div>
          </div>

          {/* Bill Savings */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest font-bold opacity-60">Bill Savings</span>
                <InfoTooltip text={`Self-consumed electricity (${(1 - EXPORT_FRACTION) * 100}%) valued at ${(UNIT_RATE_GBP * 100).toFixed(1)}p/kWh (Ofgem avg).`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-4xl font-black text-green-600">£{Math.round(billSaving).toLocaleString('en-GB')}</span>
                <span className="text-sm opacity-60">/year</span>
              </div>
            </div>
          </div>

          {/* Export Income */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border-4 border-swiss-black dark:border-white/20 flex items-center justify-center flex-shrink-0">
              <PoundSterling className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest font-bold opacity-60">SEG Export Income</span>
                <InfoTooltip text={`Exported electricity (${EXPORT_FRACTION * 100}%) sold via Smart Export Guarantee at ${(SEG_RATE_GBP * 100).toFixed(1)}p/kWh.`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-4xl font-black text-blue-600">£{Math.round(segIncome).toLocaleString('en-GB')}</span>
                <span className="text-sm opacity-60">/year</span>
              </div>
            </div>
          </div>

          {/* Payback */}
          <div className="border-t-4 border-swiss-black dark:border-white/20 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 opacity-60" />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold opacity-60">Simple Payback</p>
                  <p className="text-2xl sm:text-3xl font-black">
                    {paybackYears !== null ? `${paybackYears.toFixed(1)} yrs` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest font-bold opacity-60">Total Annual Benefit</p>
                <p className="text-2xl sm:text-3xl font-black text-green-600">£{Math.round(totalAnnual).toLocaleString('en-GB')}</p>
              </div>
            </div>
            <p className="text-xs opacity-30 mt-3 leading-relaxed">
              Based on £{INSTALL_COST_GBP.toLocaleString('en-GB')} installed cost for {SYSTEM_KWP}kWp system. Assumes south-facing roof, no shading. Consult a MCS-certified installer for a site survey.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
