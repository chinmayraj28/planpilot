# PlanPilot AI — Backend

FastAPI backend for the PlanPilot AI planning intelligence platform.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your keys
```

## Run

```bash
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

## Data Setup Order

Run these once before starting the server:

```bash
# 1. Enable PostGIS and create tables
python scripts/setup_db.py

# 2. Load spatial constraint layers
python scripts/ingest_flood.py --fz2 data/flood/Flood_Zone_2.shp --fz3 data/flood/Flood_Zone_3.shp
python scripts/ingest_conservation.py --file data/conservation/conservation_areas.geojson
python scripts/ingest_greenbelt.py --file data/greenbelt/greenbelt.shp
python scripts/ingest_article4.py --file data/article4/article4_directions.geojson

# 3. Load price paid data (needs ONSPD postcode lookup CSV)
python scripts/ingest_price_paid.py \
    --csv data/price_paid/pp-complete.csv \
    --postcodes data/postcodes/ONSPD_latest.csv

# 4. Load IBex planning application history (comma-separated Local Authority codes)
python scripts/ingest_ibex.py \
    --las E09000033,E09000022 \
    --postcodes data/postcodes/ONSPD_latest.csv \
    --years 5

# 5. Compute ML features for each historical application (joins all layers together)
python scripts/feature_engineering.py

# 6. Train the XGBoost model and save to ml/planning_model.pkl
python scripts/train_model.py
```

## Geographic Coverage & Model Scope

### Current Training Coverage

The ML model and planning history database are currently scoped to the **London Borough of Southwark** (LA code: `E09000028`), trained on ~12,301 planning applications over the last 5 years.

**Best results with postcodes:** SE1, SE5, SE11, SE15, SE16, SE17, SE21, SE22, SE24

To expand coverage, ingest additional boroughs via `ingest_ibex.py`:

```bash
# Example: add Lambeth (E09000022) and Lewisham (E09000023)
python scripts/ingest_ibex.py \
    --las E09000022,E09000023 \
    --postcodes data/postcodes/ONSPD_latest.csv \
    --years 5

# Then re-run feature engineering and retrain
python scripts/feature_engineering.py
python scripts/train_model.py
```

### What Happens for an Unknown Postcode

The app will not crash — it degrades gracefully:

| Data source | Behaviour outside coverage |
|---|---|
| **Geocoding** | Live API (postcodes.io) — works for any valid UK postcode |
| **Flood / conservation / greenbelt / Article 4** | England-wide shapefiles — accurate anywhere |
| **EPC rating** | Live API — works UK-wide, returns `N/A` if no data |
| **Nearby schools** | Live OpenStreetMap query — works anywhere |
| **Local approval rate** | Returns `0.0` — no history in DB |
| **Avg decision time** | Returns `0.0` — no history in DB |
| **Similar applications nearby** | Returns `0` — no history in DB |
| **Avg price per m²** | Returns `0.0` — no price paid records in DB |
| **Price trend** | Returns `0.0` — no price paid records in DB |
| **Comparable sales** | Returns `[]` — no price paid records in DB |

**ML prediction:** The model still runs but receives `0.0` for all local-history features. It falls back to constraint flags + project parameters only, making predictions less reliable outside the training area.

**Viability score:** Will be artificially pessimistic outside coverage because `avg_price_per_m2 = 0` removes the market strength bonus and `local_approval_rate = 0` lowers the base score.

The UI surfaces this via an amber warning in the Planning Metrics panel when no local history is found.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | None | Health check |
| GET | `/api/v1/analyze?postcode=` | JWT | Full analysis pipeline |
| GET | `/api/v1/report?postcode=` | JWT | Gemini AI planning report |

## Environment Variables

See `.env.example` for all required variables.
