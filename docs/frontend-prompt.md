# PlanPilot AI — Frontend Build Prompt

## Overview
Build the frontend for **PlanPilot AI**, a UK planning intelligence platform.
A user enters a UK postcode and receives planning constraint flags, flood risk,
approval probability, viability score, market metrics, and an AI-generated
planning report.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Map:** Leaflet (`react-leaflet`) or Mapbox GL JS
- **HTTP:** Native `fetch` (no Axios needed)
- **Icons:** `lucide-react`

---

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Supabase Auth

Use Supabase Auth for user login. The user must be signed in before they can
analyse a postcode.

### Setup
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Client
```ts
// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Auth flow
- Show a login page (`/login`) with email + password sign-in and sign-up.
- After sign-in, redirect to `/` (dashboard).
- Use `supabase.auth.getSession()` to get the current session.
- Extract the JWT: `session.access_token`
- Send this token in every backend API request as:
  `Authorization: Bearer <access_token>`
- On sign-out, call `supabase.auth.signOut()` and redirect to `/login`.

### Protecting the dashboard
Use a middleware or layout check:
```ts
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
```

---

## Backend API

**Base URL:** `process.env.NEXT_PUBLIC_BACKEND_URL` (default: `http://localhost:8000`)

All endpoints (except `/api/v1/health`) require:
```
Authorization: Bearer <supabase-access-token>
```

### Helper
```ts
// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL

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
```

---

## API Response Schemas

### `GET /api/v1/analyze?postcode=SW1A1AA`

```ts
interface AnalyzeResponse {
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
    local_approval_rate: number        // 0.0 – 1.0
    avg_decision_time_days: number
    similar_applications_nearby: number
  }
  market_metrics: {
    avg_price_per_m2: number
    price_trend_24m: number            // decimal, e.g. 0.05 = +5%
    avg_epc_rating: string             // "A" | "B" | "C" | "D" | "E" | "F" | "G"
  }
  ml_prediction: {
    approval_probability: number       // 0.0 – 1.0
  }
  viability_score: number              // 0 – 100
  viability_breakdown: {
    base_score: number
    constraint_penalty: number
    flood_penalty: number
    market_strength_bonus: number
  }
}
```

### `GET /api/v1/report?postcode=SW1A1AA`

```ts
interface ReportResponse {
  postcode: string
  report: {
    overall_outlook: string
    key_risks: string[]
    strategic_recommendation: string
    risk_mitigation: string[]
  }
  generated_at: string                 // ISO 8601
}
```

### `GET /api/v1/health` (no auth)

```ts
interface HealthResponse {
  status: 'ok' | 'error'
  model_loaded: boolean
  db_connected: boolean
}
```

### Error format
```ts
interface APIError {
  detail: string
}
// HTTP 400 – invalid postcode
// HTTP 404 – postcode not found
// HTTP 401 – missing or invalid JWT
// HTTP 500 – internal error
```

---

## Page Structure

### `/login`
- Email + password sign-in form
- Toggle to sign-up
- On success → redirect to `/`

### `/` (dashboard, auth-protected)
- Top bar: PlanPilot AI logo + sign out button
- Postcode input + "Analyse" button
- Results grid (shown after analysis, hidden initially)
- Skeleton loaders while data loads

---

## UX Loading Flow (important)

```
1. User submits postcode
2. Call /analyze and /report simultaneously
3. Show skeleton loaders on all panels
4. When /analyze resolves → render metrics, map, constraints, scores
5. When /report resolves → render AI Planning Report panel
   (report takes longer ~3–8s, show a spinner/shimmer in that panel)
6. On error → show toast or inline error message
```

---

## Component Breakdown

```
app/
├── login/
│   └── page.tsx              # Auth page
├── page.tsx                  # Dashboard (protected)
├── layout.tsx
└── globals.css

components/
├── PostcodeInput.tsx          # Input + submit button
├── AnalysisDashboard.tsx      # Grid layout, orchestrates all panels
├── map/
│   └── PlanningMap.tsx        # Leaflet map centred on lat/lon
├── panels/
│   ├── ApprovalProbability.tsx   # Circular gauge 0–100%
│   ├── ViabilityScore.tsx        # Score bar 0–100
│   ├── ConstraintsPanel.tsx      # Flood zone, conservation, greenbelt, article4
│   ├── PlanningMetrics.tsx       # Approval rate, decision time
│   ├── MarketMetrics.tsx         # Price per m2, trend, EPC
│   └── AIReport.tsx              # Gemini report with loading state
└── ui/
    ├── SkeletonCard.tsx
    ├── Badge.tsx                 # e.g. "Conservation Area" tag
    └── ScoreBar.tsx
```

---

## Panel Details

### ApprovalProbability
- Display as a large circular/arc gauge
- Colour: green (>70%), amber (40–70%), red (<40%)
- Show percentage with one decimal place

### ViabilityScore
- Horizontal bar 0–100
- Colour coding same as above
- Show breakdown on hover/expand: base score, penalties, bonus

### ConstraintsPanel
- Show 4 flags as coloured badges:
  - Flood Zone: 1 (blue/low), 2 (amber/medium), 3 (red/high)
  - Conservation Area: red if true, green if false
  - Greenbelt: red if true, green if false
  - Article 4: amber if true, green if false

### PlanningMetrics
- Approval rate as a percentage bar
- Decision time in days
- Nearby similar applications count

### MarketMetrics
- Avg price per m2 formatted as £12,500/m²
- Price trend as ▲ +5.0% or ▼ -2.1% with colour
- EPC rating shown as coloured letter badge (A=dark green … G=red)

### PlanningMap (Leaflet)
- Centre map on `location.lat`, `location.lon`
- Drop a pin at the postcode location
- Zoom level ~14
- Use OpenStreetMap tiles (free, no API key needed):
  `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### AIReport
- Show a shimmer skeleton while loading
- When loaded, render four sections:
  1. Overall Outlook (paragraph)
  2. Key Risks (bulleted list)
  3. Strategic Recommendation (paragraph)
  4. Risk Mitigation (bulleted list)
- Add a subtle "Generated by Gemini 2.0 Flash" label at the bottom

---

## Tailwind Design Tokens (suggested)

Use a dark professional theme:
```
Background:  #0f1117
Card:        #1a1d27
Border:      #2a2d3a
Text primary:    white
Text secondary:  #9ca3af
Accent green:    #22c55e
Accent amber:    #f59e0b
Accent red:      #ef4444
Accent blue:     #3b82f6
```

---

## Skeleton Loading

While waiting for API responses, show placeholder shimmer cards in place of
each panel. Use Tailwind's `animate-pulse` with grey rounded blocks.

```tsx
// components/ui/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#1a1d27] p-4 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-700 rounded w-2/3" />
    </div>
  )
}
```

---

## Notes for Integration

- The backend runs on `http://localhost:8000` in development.
- CORS is enabled on the backend for `http://localhost:3000`.
- Always send the Supabase JWT — the backend will return HTTP 401 if missing.
- Postcode formatting: send as-is (e.g. `SW1A 1AA` or `SW1A1AA`); backend normalises it.
- Both `/analyze` and `/report` should be called in parallel (use `Promise.all`
  or fire both independently) — do not wait for `/analyze` to finish before
  calling `/report`.
