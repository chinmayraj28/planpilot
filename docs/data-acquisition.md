# Data Acquisition Guide

> **Scope: Southwark only** — all data is scoped to the London Borough of
> Southwark (LA code: `E09000028`) for the hackathon build.

This document explains every dataset you need to download before running the
ingestion scripts. All datasets are free and openly licensed.

## Current data folder status

```
backend/data/
├── flood/
│   └── RoFRS_London.shp  ✅  (+ .dbf, .prj, .sbn, .sbx, .shx)
├── conservation/
│   └── Conservation_Areas.shp  ✅  (+ .cpg, .dbf, .prj, .shx)
├── greenbelt/
│   └── England_Green_Belt_2024_25_WGS84.shp  ✅  (+ .dbf, .prj, .shx)
├── article4/
│   └── article4_directions.geojson  ✅
├── price_paid/
│   └── pp-complete.csv  ✅  (5 GB)
└── postcodes/
    └── ONSPD_NOV_2025_UK.csv  ✅  (1.3 GB)
```

**All required datasets are present.** No additional downloads needed.

---

## Dataset notes

### 1. Flood Risk — `RoFRS_London.shp`
**Source:** Environment Agency — Risk of Flooding from Rivers and Sea (London)
**CRS:** British National Grid — converted to WGS84 automatically by ogr2ogr

Uses `PROB_4BAND` field with values mapped to our zone scale:
| PROB_4BAND | zone_number | Planning meaning |
|---|---|---|
| High | 3 | High risk — most restrictive |
| Medium | 2 | Medium risk |
| Low | 1 | Low risk |
| Very Low | 1 | Low risk |

Areas with no polygon default to zone 1 (handled in PostGIS query).

---

### 2. Conservation Areas — `Conservation_Areas.shp`
**Source:** Historic England
**CRS:** British National Grid — converted automatically by ogr2ogr
**Coverage:** England-wide (Southwark areas included)

---

### 3. Green Belt — `England_Green_Belt_2024_25_WGS84.shp`
**Source:** DLUHC — England Green Belt 2024-25
**CRS:** WGS84 already — no conversion needed
**Note:** Southwark has no greenbelt, so all Southwark postcodes will return `false`.
This is correct behaviour.

---

### 4. Article 4 Directions — `article4_directions.geojson`
**Source:** Planning Data (DLUHC)
**CRS:** WGS84 — coordinates confirmed in London range
**Features:** 480 polygons

---

### 5. Price Paid Data — `pp-complete.csv`
**Source:** Land Registry — Complete dataset
**Size:** 5 GB, all transactions since 1995
The ingestion script filters to last 5 years automatically.

---

### 6. ONS Postcode Directory — `ONSPD_NOV_2025_UK.csv`
**Source:** ONS Geography — November 2025 release
**Size:** 1.3 GB
**Key columns:** `pcds` (postcode with space), `lat`, `long`

---

## Prerequisites before running ingestion scripts

### Install GDAL / ogr2ogr
Required for loading shapefiles into PostGIS.

**macOS:**
```bash
brew install gdal
```

**Ubuntu/Debian:**
```bash
sudo apt-get install gdal-bin
```

Verify:
```bash
ogr2ogr --version
# GDAL 3.x.x, ...
```

### Python dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Supabase database
Ensure your `.env` is filled in with `DATABASE_URL`, then:
```bash
python scripts/setup_db.py
```

---

## Ingestion commands (use actual filenames)

Run from the `backend/` directory in this exact order:

```bash
# 1. Flood risk (single RoFRS file — not separate FZ2/FZ3)
python scripts/ingest_flood.py \
    --file data/flood/RoFRS_London.shp

# 2. Conservation areas (shapefile, not GeoJSON)
python scripts/ingest_conservation.py \
    --file data/conservation/Conservation_Areas.shp

# 3. Green belt
python scripts/ingest_greenbelt.py \
    --file data/greenbelt/England_Green_Belt_2024_25_WGS84.shp

# 4. Article 4 directions
python scripts/ingest_article4.py \
    --file data/article4/article4_directions.geojson

# 5. Price paid data
python scripts/ingest_price_paid.py \
    --csv data/price_paid/pp-complete.csv \
    --postcodes data/postcodes/ONSPD_NOV_2025_UK.csv

# 6. IBex planning applications — Southwark only
python scripts/ingest_ibex.py \
    --las E09000028 \
    --postcodes data/postcodes/ONSPD_NOV_2025_UK.csv \
    --years 5
```

Once complete, proceed to `docs/ml-training.md`.
