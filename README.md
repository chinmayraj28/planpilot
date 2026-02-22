<p align="center">
  <img src="https://img.shields.io/badge/HackLondon-2026-E53935?style=for-the-badge&labelColor=000000" alt="HackLondon 2026" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/XGBoost-ML-FF6F00?style=for-the-badge" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Gemini_2.0-Flash-4285F4?style=for-the-badge&logo=google" alt="Gemini 2.0 Flash" />
</p>

<h1 align="center">PlanPilot AI</h1>
<h3 align="center">UK Planning Intelligence Platform</h3>

<p align="center">
  <em>Enter a postcode. Get an instant, data-driven verdict on whether your planning application will be approved — powered by machine learning on 36,000+ real planning decisions, 7 government datasets, and AI-generated strategic reports.</em>
</p>

---

## The Problem

Getting planning permission in the UK is a **black box**. Homeowners, developers, and architects spend thousands of pounds on applications with no idea whether they'll be approved. Local approval rates, flood risk, conservation zones, and market conditions all play a role — but this data is scattered across dozens of government sources and nearly impossible to interpret together.

## The Solution

**PlanPilot AI** brings all of it together in one click. Enter a UK postcode and your project details, and get:

| Feature | Description |
|---|---|
| **ML Approval Prediction** | XGBoost model trained on 36,000+ real IBEX planning decisions with 10 location features |
| **Viability Score** | Composite 0–100 score weighing constraints, market data, and project complexity |
| **Constraint Mapping** | Flood zone, conservation area, green belt, and Article 4 direction checks |
| **Market Intelligence** | Average price/m², 24-month trends, comparable sales, and EPC ratings |
| **AI Strategic Report** | Google Gemini 2.0 Flash generates a bespoke planning strategy report |
| **Interactive Map** | Leaflet map with nearby planning applications and constraint overlays |
| **Project Personalisation** | Tailor predictions to your application type, property type, storeys, and floor area |
| **Manual Overrides** | Override any of the 10 ML features with your own data for power-user analysis |
| **Document Upload + OCR** | Upload a planning PDF or image — Gemini 2.0 Flash extracts postcode, project params, and constraints to auto-fill the form |
| **Comparison Mode** | Compare up to 3 postcodes side-by-side with a full metric comparison table |
| **Share / Link Results** | Copy a shareable URL that auto-triggers analysis for the same postcode and project params |
| **Dark Mode** | Toggle between light and dark themes — persisted across sessions |
| **CSV Export** | Download all analysis data as a structured CSV (location, constraints, market, planning, schools) |
| **Nearby Schools** | Automatically fetches the 5 closest schools with Ofsted ratings |
| **PDF Export** | One-click print/export of the full dashboard |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 16 · React 19 · Framer Motion · Tailwind CSS      │
│  Leaflet Maps · Supabase Auth (Google OAuth)                │
├─────────────────────────────────────────────────────────────┤
│                         ▼ REST API                          │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                              │
│  FastAPI · asyncpg · JWT Auth · CORS                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Geocoding│  │ ML Engine│  │ Viability│  │ Gemini 2.0 │  │
│  │ (postcodes│  │ (XGBoost)│  │  Scorer  │  │   Flash    │  │
│  │   .io)   │  │          │  │          │  │ AI Reports │  │
│  └──────────┘  └──────────┘  └──────────┘  │ + Doc OCR  │  │
│                                            └────────────┘  │
│                         ▼                                   │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE                               │
│  Supabase PostgreSQL                                        │
│  Planning · Flood · Conservation · Green Belt · Article 4   │
│  Price Paid · EPC · Schools                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Sources

We ingest and cross-reference **7 UK government and open datasets**:

| # | Dataset | Source | What it provides |
|---|---|---|---|
| 1 | **Planning Decisions** | IBEX / Serac Tech | 36,000+ applications with outcomes, types, decision dates |
| 2 | **Flood Risk Zones** | Environment Agency | Flood zone 1/2/3 classification by location |
| 3 | **Conservation Areas** | Historic England | Whether a location falls within a protected conservation area |
| 4 | **Green Belt** | DLUHC / Local Authorities | Green belt boundary checks |
| 5 | **Article 4 Directions** | Local Authorities | Restrictions on permitted development rights |
| 6 | **Price Paid** | HM Land Registry | Property transaction prices, trends, comparable sales |
| 7 | **EPC Ratings** | DLUHC | Energy Performance Certificate ratings for nearby properties |

---

## ML Model

The approval prediction engine uses an **XGBoost gradient-boosted classifier** trained on real planning decision data.

### 10 Input Features (all auto-fetched from postcode)

| Feature | Type | Description |
|---|---|---|
| `flood_zone` | int (1–3) | Environment Agency flood risk zone |
| `in_conservation_area` | bool | Inside a conservation area |
| `in_greenbelt` | bool | Inside the green belt |
| `in_article4_zone` | bool | Subject to Article 4 direction |
| `local_approval_rate` | float (0–1) | Historical approval rate in the area |
| `avg_decision_time_days` | float | Average days to decision locally |
| `similar_applications_nearby` | int | Count of similar recent applications |
| `avg_price_per_m2` | float (£) | Average property price per square metre |
| `price_trend_24m` | float | 24-month price trend (± percentage) |
| `avg_epc_rating` | ordinal (A–G) | Average energy efficiency rating |

### Post-Hoc Personalisation Adjustments

After the base ML prediction, heuristic adjustments are applied based on the user's project:

- **Application Type Risk** — Listed building works (−12%), demolition (−10%), new builds (−8%), etc.
- **Property Type Risk** — Commercial (−5%), flats (−3%), detached (+2%)
- **Storey Penalty** — −2% per storey above 2
- **Floor Area Penalty** — −3% for projects over 100m², −6% over 200m²
- **Conservation + Listed Combo** — Additional −5% penalty

---

## Screenshots

### Landing Page
> Animated pipeline demo showing the 5-step analysis process, data sources section, and feature cards with Framer Motion animations.

### Dashboard
> Full postcode analysis with KPI strip, approval gauge, viability score, constraint panel, market metrics, interactive map, AI report, nearby schools, and build cost calculator.

### Analysis Form
> Project personalisation form with application type, property type, storeys, floor area, and collapsible advanced manual overrides panel with per-field toggles.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** 3.11 (recommended via Conda)
- **PostgreSQL** (Supabase hosted)

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/hacklondon-26.git
cd hacklondon-26
```

### 2. Backend Setup

```bash
cd backend
conda create -n hacklondon python=3.11 -y
conda activate hacklondon
pip install -r requirements.txt
conda install -c conda-forge llvm-openmp -y  # Required for XGBoost on macOS ARM
```

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://user:pass@host:5432/postgres
GEMINI_API_KEY=your_gemini_api_key
EPC_API_KEY=your_epc_api_key
EPC_API_EMAIL=your_email
IBEX_API_KEY=your_ibex_api_key
IBEX_BASE_URL=https://ibex.seractech.co.uk
FRONTEND_URL=http://localhost:3000
```

```bash
# Ingest data (one-time)
python scripts/setup_db.py
python scripts/ingest_ibex.py
python scripts/ingest_flood.py
python scripts/ingest_conservation.py
python scripts/ingest_greenbelt.py
python scripts/ingest_article4.py
python scripts/ingest_price_paid.py

# Train the ML model
python scripts/train_model.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

```bash
npm run dev
```

Visit **http://localhost:3000**

---

## Project Structure

```
hacklondon-26/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # analyze, report, health, upload endpoints
│   │   ├── db/                # asyncpg database pool
│   │   ├── middleware/        # JWT authentication
│   │   ├── schemas/           # Pydantic models
│   │   ├── services/          # Core business logic
│   │   │   ├── constraints.py # Flood, conservation, greenbelt, article4
│   │   │   ├── gemini.py      # AI report generation
│   │   │   ├── geocoding.py   # postcodes.io integration
│   │   │   ├── market.py      # Price paid + EPC data
│   │   │   ├── ml.py          # XGBoost prediction engine
│   │   │   ├── planning.py    # Planning metrics from IBEX data
│   │   │   └── viability.py   # Composite viability scorer
│   │   └── main.py            # FastAPI app with lifespan
│   ├── ml/                    # Trained model (.pkl)
│   └── scripts/               # Data ingestion + training scripts
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Animated landing page
│   │   ├── login/page.tsx     # Auth page with Google OAuth
│   │   └── dashboard/page.tsx # Main analysis dashboard
│   ├── components/
│   │   ├── PostcodeInput.tsx   # Full analysis form with overrides
│   │   ├── DocumentUpload.tsx  # Drag-and-drop OCR upload component
│   │   ├── ComparisonMode.tsx  # Side-by-side postcode comparison
│   │   ├── Sidebar.tsx         # Navigation + search history
│   │   ├── map/PlanningMap.tsx # Leaflet interactive map
│   │   ├── panels/            # Dashboard panels (6+ components)
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── api.ts             # Backend API client
│       ├── csv.ts             # CSV export utility
│       ├── supabase.ts        # Auth client
│       └── types.ts           # TypeScript type definitions
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Maps** | Leaflet + React Leaflet |
| **Auth** | Supabase Auth (Google OAuth + JWT) |
| **Backend** | FastAPI, asyncpg, Pydantic v2 |
| **ML** | XGBoost, scikit-learn, NumPy, pandas |
| **AI Reports** | Google Gemini 2.0 Flash |
| **Database** | Supabase PostgreSQL |
| **Geocoding** | postcodes.io API |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check (model loaded, DB connected) |
| `GET` | `/api/v1/analyze?postcode=...` | Full analysis with ML prediction, constraints, market data |
| `GET` | `/api/v1/report?postcode=...` | AI-generated strategic planning report |
| `POST` | `/api/v1/upload-document` | Upload a planning document (PDF/image) for Gemini OCR extraction |

The `/analyze` endpoint supports optional query parameters:
- **Project params**: `application_type`, `property_type`, `num_storeys`, `estimated_floor_area_m2`
- **Manual overrides**: `manual_flood_zone`, `manual_conservation`, `manual_greenbelt`, `manual_article4`, `manual_approval_rate`, `manual_decision_days`, `manual_nearby_apps`, `manual_price_m2`, `manual_price_trend`, `manual_epc`

---

## Team

Built at **HackLondon 2026**

---

## License

MIT
