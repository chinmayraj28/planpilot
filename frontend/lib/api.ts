const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const analyzePostcode = (postcode: string, token: string) =>
  apiFetch(`/api/v1/analyze?postcode=${encodeURIComponent(postcode)}`, token)

export const fetchReport = (postcode: string, token: string) =>
  apiFetch(`/api/v1/report?postcode=${encodeURIComponent(postcode)}`, token)

export const checkHealth = () =>
  fetch(`${BASE}/api/v1/health`).then(r => r.json())
