'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { AlertTriangle, Trees, Building2, FileWarning } from 'lucide-react'

interface ConstraintsPanelProps {
  constraints: {
    flood_zone: 1 | 2 | 3
    in_conservation_area: boolean
    in_greenbelt: boolean
    in_article4_zone: boolean
  }
}

export function ConstraintsPanel({ constraints }: ConstraintsPanelProps) {
  const floodZoneConfig = {
    1: { variant: 'info' as const, label: 'Flood Zone 1 - Low Risk', tooltip: 'Low probability of flooding. Standard insurance available.' },
    2: { variant: 'warning' as const, label: 'Flood Zone 2 - Medium Risk', tooltip: 'Moderate flood risk. May require flood risk assessment and mitigation measures.' },
    3: { variant: 'danger' as const, label: 'Flood Zone 3 - High Risk', tooltip: 'High probability of flooding. Requires detailed flood risk assessment and strict mitigation.' },
  }

  const floodConfig = floodZoneConfig[constraints.flood_zone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="swiss-card swiss-dots"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-tight">
          Planning Constraints
        </h3>
        <InfoTooltip text="Key regulatory restrictions that may affect development permissions and requirements." />
      </div>

      <div className="space-y-6">
        {/* Flood Zone */}
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={floodConfig.variant} label={floodConfig.label} />
              <InfoTooltip text={floodConfig.tooltip} />
            </div>
          </div>
        </div>

        {/* Conservation Area */}
        <div className="flex items-start gap-4">
          <Building2 className="w-6 h-6 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={constraints.in_conservation_area ? 'danger' : 'success'}
                label={constraints.in_conservation_area ? 'In Conservation Area' : 'No Conservation Restrictions'}
              />
              <InfoTooltip
                text={
                  constraints.in_conservation_area
                    ? 'Property is in a conservation area. Additional restrictions apply to alterations and developments.'
                    : 'Property is not in a conservation area. Standard planning rules apply.'
                }
              />
            </div>
          </div>
        </div>

        {/* Greenbelt */}
        <div className="flex items-start gap-4">
          <Trees className="w-6 h-6 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={constraints.in_greenbelt ? 'danger' : 'success'}
                label={constraints.in_greenbelt ? 'In Greenbelt' : 'Outside Greenbelt'}
              />
              <InfoTooltip
                text={
                  constraints.in_greenbelt
                    ? 'Property is in greenbelt land. Development is heavily restricted to prevent urban sprawl.'
                    : 'Property is not in greenbelt. Development is generally more feasible.'
                }
              />
            </div>
          </div>
        </div>

        {/* Article 4 */}
        <div className="flex items-start gap-4">
          <FileWarning className="w-6 h-6 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={constraints.in_article4_zone ? 'warning' : 'success'}
                label={constraints.in_article4_zone ? 'Article 4 Direction' : 'No Article 4'}
              />
              <InfoTooltip
                text={
                  constraints.in_article4_zone
                    ? 'Property is subject to Article 4 Direction. Certain permitted development rights are withdrawn.'
                    : 'No Article 4 Direction applies. Standard permitted development rights available.'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
