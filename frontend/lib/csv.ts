import type { AnalyzeResponse } from './types'

/**
 * Convert an AnalyzeResponse into a downloadable CSV file.
 */
export function exportToCSV(data: AnalyzeResponse) {
  const rows: string[][] = []

  // Header section
  rows.push(['PlanPilot AI — Analysis Export'])
  rows.push(['Generated', new Date().toISOString()])
  rows.push([])

  // Location
  rows.push(['--- LOCATION ---'])
  rows.push(['Postcode', data.postcode])
  rows.push(['District', data.location.district])
  rows.push(['Ward', data.location.ward])
  rows.push(['Latitude', String(data.location.lat)])
  rows.push(['Longitude', String(data.location.lon)])
  rows.push([])

  // Project parameters
  rows.push(['--- PROJECT PARAMETERS ---'])
  rows.push(['Application Type', data.project_params.application_type])
  rows.push(['Property Type', data.project_params.property_type])
  rows.push(['Storeys', String(data.project_params.num_storeys)])
  rows.push(['Floor Area (m²)', String(data.project_params.estimated_floor_area_m2)])
  rows.push([])

  // ML Prediction
  rows.push(['--- ML PREDICTION ---'])
  rows.push(['Approval Probability', `${(data.ml_prediction.approval_probability * 100).toFixed(1)}%`])
  rows.push(['Viability Score', `${data.viability_score.toFixed(0)}/100`])
  rows.push([])

  // Viability Breakdown
  rows.push(['--- VIABILITY BREAKDOWN ---'])
  rows.push(['Base Score', String(data.viability_breakdown.base_score)])
  rows.push(['Constraint Penalty', String(data.viability_breakdown.constraint_penalty)])
  rows.push(['Flood Penalty', String(data.viability_breakdown.flood_penalty)])
  rows.push(['Market Strength Bonus', String(data.viability_breakdown.market_strength_bonus)])
  rows.push(['Project Complexity Penalty', String(data.viability_breakdown.project_complexity_penalty)])
  rows.push([])

  // Constraints
  rows.push(['--- CONSTRAINTS ---'])
  rows.push(['Flood Zone', String(data.constraints.flood_zone)])
  rows.push(['Conservation Area', data.constraints.in_conservation_area ? 'Yes' : 'No'])
  rows.push(['Green Belt', data.constraints.in_greenbelt ? 'Yes' : 'No'])
  rows.push(['Article 4 Zone', data.constraints.in_article4_zone ? 'Yes' : 'No'])
  rows.push([])

  // Planning Metrics
  rows.push(['--- PLANNING METRICS ---'])
  rows.push(['Local Approval Rate', `${(data.planning_metrics.local_approval_rate * 100).toFixed(1)}%`])
  rows.push(['Avg Decision Time', `${data.planning_metrics.avg_decision_time_days.toFixed(0)} days`])
  rows.push(['Similar Applications Nearby', String(data.planning_metrics.similar_applications_nearby)])
  rows.push([])

  // Market Metrics
  rows.push(['--- MARKET METRICS ---'])
  rows.push(['Avg Price per m²', `£${data.market_metrics.avg_price_per_m2.toLocaleString('en-GB')}`])
  rows.push(['Price Trend (24m)', `${(data.market_metrics.price_trend_24m * 100).toFixed(1)}%`])
  rows.push(['Avg EPC Rating', data.market_metrics.avg_epc_rating])
  rows.push([])

  // Recent Applications
  if (data.planning_metrics.recent_applications.length > 0) {
    rows.push(['--- RECENT APPLICATIONS ---'])
    rows.push(['Reference', 'Postcode', 'Decision', 'Date', 'Type'])
    for (const app of data.planning_metrics.recent_applications) {
      rows.push([app.reference, app.postcode, app.decision, app.decision_date, app.application_type])
    }
    rows.push([])
  }

  // Comparable Sales
  if (data.market_metrics.comparable_sales.length > 0) {
    rows.push(['--- COMPARABLE SALES ---'])
    rows.push(['Postcode', 'Price', 'Sale Date'])
    for (const sale of data.market_metrics.comparable_sales) {
      rows.push([sale.postcode, `£${sale.price.toLocaleString('en-GB')}`, sale.sale_date])
    }
    rows.push([])
  }

  // Nearby Schools
  if (data.nearby_schools.length > 0) {
    rows.push(['--- NEARBY SCHOOLS ---'])
    rows.push(['Name', 'Type', 'Ofsted Rating', 'Distance (m)'])
    for (const school of data.nearby_schools) {
      rows.push([school.name, school.type, school.ofsted_rating, String(school.distance_m)])
    }
  }

  // Encode CSV
  const csv = rows.map(row =>
    row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""')
      return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped
    }).join(',')
  ).join('\n')

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `planpilot-${data.postcode.replace(/\s/g, '')}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
