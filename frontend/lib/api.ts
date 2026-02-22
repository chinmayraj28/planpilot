import type { ProjectParams, ManualOverrides } from './types'

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body.detail) message = body.detail
    } catch {
      // response wasn't JSON — use status text
      message = res.statusText || message
    }
    throw new Error(message)
  }
  return res.json()
}

export const analyzePostcode = (
  postcode: string,
  token: string,
  params?: ProjectParams,
  overrides?: ManualOverrides,
) => {
  const query = new URLSearchParams({
    postcode,
    ...(params?.application_type && { application_type: params.application_type }),
    ...(params?.property_type && { property_type: params.property_type }),
    ...(params?.num_storeys && { num_storeys: String(params.num_storeys) }),
    ...(params?.estimated_floor_area_m2 && { estimated_floor_area_m2: String(params.estimated_floor_area_m2) }),
  })

  // Append manual overrides (only the ones the user actually filled in)
  if (overrides) {
    if (overrides.flood_zone != null) query.set('manual_flood_zone', String(overrides.flood_zone))
    if (overrides.in_conservation_area != null) query.set('manual_conservation', String(overrides.in_conservation_area))
    if (overrides.in_greenbelt != null) query.set('manual_greenbelt', String(overrides.in_greenbelt))
    if (overrides.in_article4_zone != null) query.set('manual_article4', String(overrides.in_article4_zone))
    if (overrides.local_approval_rate != null) query.set('manual_approval_rate', String(overrides.local_approval_rate))
    if (overrides.avg_decision_time_days != null) query.set('manual_decision_days', String(overrides.avg_decision_time_days))
    if (overrides.similar_applications_nearby != null) query.set('manual_nearby_apps', String(overrides.similar_applications_nearby))
    if (overrides.avg_price_per_m2 != null) query.set('manual_price_m2', String(overrides.avg_price_per_m2))
    if (overrides.price_trend_24m != null) query.set('manual_price_trend', String(overrides.price_trend_24m))
    if (overrides.avg_epc_rating != null) query.set('manual_epc', overrides.avg_epc_rating)
  }

  return apiFetch(`/api/v1/analyze?${query.toString()}`, token)
}

export const fetchReport = (postcode: string, token: string) =>
  apiFetch(`/api/v1/report?postcode=${encodeURIComponent(postcode)}`, token)

export const checkHealth = () =>
  fetch(`${BASE}/api/v1/health`).then(r => r.json())
