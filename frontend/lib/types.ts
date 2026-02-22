export type ApplicationType = 'extension' | 'new_build' | 'loft_conversion' | 'change_of_use' | 'listed_building' | 'demolition' | 'other'
export type PropertyType = 'detached' | 'semi_detached' | 'terraced' | 'flat' | 'commercial' | 'land'

export interface ProjectParams {
  application_type: ApplicationType
  property_type: PropertyType
  num_storeys: number
  estimated_floor_area_m2: number
}

/** Optional manual overrides for the 10 location-based model features. */
export interface ManualOverrides {
  flood_zone?: 1 | 2 | 3
  in_conservation_area?: boolean
  in_greenbelt?: boolean
  in_article4_zone?: boolean
  local_approval_rate?: number
  avg_decision_time_days?: number
  similar_applications_nearby?: number
  avg_price_per_m2?: number
  price_trend_24m?: number
  avg_epc_rating?: string
}

export interface AnalyzeResponse {
  postcode: string
  project_params: ProjectParams
  location: {
    lat: number
    lon: number
    district: string
    ward: string
  }
  constraints: {
    flood_zone: 1 | 2 | 3
    in_conservation_area: boolean
    in_greenbelt: boolean
    in_article4_zone: boolean
  }
  planning_metrics: {
    local_approval_rate: number
    avg_decision_time_days: number
    similar_applications_nearby: number
    recent_applications: Array<{
      reference: string
      postcode: string
      decision: string
      decision_date: string
      application_type: string
    }>
  }
  market_metrics: {
    avg_price_per_m2: number
    price_trend_24m: number
    avg_epc_rating: string
    comparable_sales: Array<{
      postcode: string
      price: number
      sale_date: string
    }>
  }
  ml_prediction: {
    approval_probability: number
  }
  viability_score: number
  viability_breakdown: {
    base_score: number
    constraint_penalty: number
    flood_penalty: number
    market_strength_bonus: number
    project_complexity_penalty: number
  }
  nearby_schools: Array<{
    name: string
    type: string
    ofsted_rating: string
    distance_m: number
  }>
}

export interface ReportResponse {
  postcode: string
  report: {
    overall_outlook: string
    key_risks: string[]
    strategic_recommendation: string
    risk_mitigation: string[]
  }
  generated_at: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  model_loaded: boolean
  db_connected: boolean
}
