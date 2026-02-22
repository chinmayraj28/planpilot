'use client'

import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { AlertTriangle, Trees, Building2, FileWarning, CheckCircle } from 'lucide-react'

interface ConstraintsPanelProps {
  constraints: {
    flood_zone: 1 | 2 | 3
    in_conservation_area: boolean
    in_greenbelt: boolean
    in_article4_zone: boolean
  }
}

export function ConstraintsPanel({ constraints }: ConstraintsPanelProps) {
  const floodConfig = {
    1: { rowClass: 'constraint-row-safe', icon: CheckCircle, iconClass: 'text-green-600', label: 'Flood Zone 1', sub: 'Low Risk', tooltip: 'Low probability of flooding. Standard insurance available.' },
    2: { rowClass: 'constraint-row-warn', icon: AlertTriangle, iconClass: 'text-amber-600', label: 'Flood Zone 2', sub: 'Medium Risk — FRA required', tooltip: 'Moderate flood risk. Flood risk assessment and mitigation measures required.' },
    3: { rowClass: 'constraint-row-danger', icon: AlertTriangle, iconClass: 'text-red-600', label: 'Flood Zone 3', sub: 'High Risk — Sequential test applies', tooltip: 'High probability of flooding. Sequential and exception tests required.' },
  }[constraints.flood_zone]

  const FloodIcon = floodConfig.icon

  const rows = [
    {
      Icon: FloodIcon,
      rowClass: floodConfig.rowClass,
      iconClass: floodConfig.iconClass,
      label: floodConfig.label,
      sub: floodConfig.sub,
      tooltip: floodConfig.tooltip,
    },
    {
      Icon: constraints.in_conservation_area ? Building2 : CheckCircle,
      rowClass: constraints.in_conservation_area ? 'constraint-row-danger' : 'constraint-row-safe',
      iconClass: constraints.in_conservation_area ? 'text-red-600' : 'text-green-600',
      label: constraints.in_conservation_area ? 'Conservation Area' : 'No Conservation Area',
      sub: constraints.in_conservation_area ? 'Design restrictions apply' : 'Standard planning rules',
      tooltip: constraints.in_conservation_area
        ? 'Additional restrictions apply to alterations and developments. Heritage assessment likely required.'
        : 'Not in a conservation area. Standard planning rules apply.',
    },
    {
      Icon: constraints.in_greenbelt ? Trees : CheckCircle,
      rowClass: constraints.in_greenbelt ? 'constraint-row-danger' : 'constraint-row-safe',
      iconClass: constraints.in_greenbelt ? 'text-red-600' : 'text-green-600',
      label: constraints.in_greenbelt ? 'Greenbelt Land' : 'Outside Greenbelt',
      sub: constraints.in_greenbelt ? 'Very special circumstances only' : 'Development generally feasible',
      tooltip: constraints.in_greenbelt
        ? 'Development is heavily restricted. Only "very special circumstances" can justify new buildings.'
        : 'Not in greenbelt. Development is generally more feasible subject to other constraints.',
    },
    {
      Icon: constraints.in_article4_zone ? FileWarning : CheckCircle,
      rowClass: constraints.in_article4_zone ? 'constraint-row-warn' : 'constraint-row-safe',
      iconClass: constraints.in_article4_zone ? 'text-amber-600' : 'text-green-600',
      label: constraints.in_article4_zone ? 'Article 4 Direction' : 'No Article 4 Direction',
      sub: constraints.in_article4_zone ? 'Permitted development rights removed' : 'Full PD rights available',
      tooltip: constraints.in_article4_zone
        ? 'Certain permitted development rights are withdrawn. Full planning consent required for changes.'
        : 'No Article 4 Direction applies. Standard permitted development rights available.',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="swiss-card"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg font-black uppercase tracking-tight">Planning Constraints</h3>
        <InfoTooltip text="Key regulatory restrictions that may affect development permissions and requirements." />
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className={row.rowClass}
          >
            <row.Icon className={`w-5 h-5 flex-shrink-0 ${row.iconClass}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black uppercase tracking-tight">{row.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{row.sub}</p>
            </div>
            <InfoTooltip text={row.tooltip} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
