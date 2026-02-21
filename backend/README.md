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

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | None | Health check |
| GET | `/api/v1/analyze?postcode=` | JWT | Full analysis pipeline |
| GET | `/api/v1/report?postcode=` | JWT | Gemini AI planning report |

## Environment Variables

See `.env.example` for all required variables.
