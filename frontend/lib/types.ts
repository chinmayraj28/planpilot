export interface AnalyzeResponse {
  postcode: string
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
  }
  market_metrics: {
    avg_price_per_m2: number
    price_trend_24m: number
    avg_epc_rating: string
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
  }
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
