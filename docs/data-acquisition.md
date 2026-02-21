# Data Acquisition Guide

This document explains every dataset you need to download before running the
ingestion scripts. All datasets are free and openly licensed.

Place downloaded files in the `backend/data/` directory as shown below.

```
backend/data/
├── flood/
│   ├── Flood_Zone_2.shp  (+ .dbf, .prj, .shx)
│   └── Flood_Zone_3.shp  (+ .dbf, .prj, .shx)
├── conservation/
│   └── conservation_areas.geojson
├── greenbelt/
│   └── greenbelt.shp     (+ .dbf, .prj, .shx)
├── article4/
│   └── article4_directions.geojson
├── price_paid/
│   └── pp-complete.csv
└── postcodes/
    └── ONSPD_latest.csv
```

---

## 1. Price Paid Data (Land Registry)

**Used for:** avg price per m², 24-month price trend
**Script:** `scripts/ingest_price_paid.py`

1. Go to: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
2. Under **"Complete dataset"**, download `pp-complete.csv` (approx 4–5 GB).
3. Place at `backend/data/price_paid/pp-complete.csv`

**Licence:** Open Government Licence v3.0

> Note: The complete file includes all transactions since 1995. The ingestion
> script automatically filters to the last 5 years, so you don't need to
> pre-filter it.

---

## 2. ONS Postcode Directory (ONSPD)

**Used for:** mapping postcodes to lat/lon during IBex and Price Paid ingestion
**Script:** `scripts/ingest_price_paid.py`, `scripts/ingest_ibex.py`

1. Go to: https://geoportal.statistics.gov.uk
2. Search for **"ONS Postcode Directory"**
3. Download the latest release — look for the CSV file inside the ZIP
   (filename like `ONSPD_NOV_2024_UK.csv`)
4. Place at `backend/data/postcodes/ONSPD_latest.csv`

**Key columns used:** `pcd` (postcode), `lat` (latitude), `long` (longitude)

**Licence:** Open Government Licence v3.0

---

## 3. Flood Risk Zones (Environment Agency)

**Used for:** flood zone flag (1/2/3) per postcode
**Script:** `scripts/ingest_flood.py`

1. Go to: https://www.data.gov.uk/dataset/flood-risk-zones
2. Download **Flood Zone 2** and **Flood Zone 3** shapefiles separately.
   - Look for the England-wide datasets (not regional)
   - Each download is a ZIP containing `.shp`, `.dbf`, `.prj`, `.shx` files
3. Extract and place at:
   - `backend/data/flood/Flood_Zone_2.shp` (+ accompanying files)
   - `backend/data/flood/Flood_Zone_3.shp` (+ accompanying files)

**Licence:** Open Government Licence v3.0

> Areas **not covered** by Flood Zone 2 or 3 are treated as Flood Zone 1
> (lowest risk) — this is handled automatically in the PostGIS query.

---

## 4. Conservation Areas

**Used for:** conservation area flag per postcode
**Script:** `scripts/ingest_conservation.py`

1. Go to: https://www.data.gov.uk/dataset/conservation-areas
2. Download the **GeoJSON** or **shapefile** for England.
   - If only a shapefile is available, `ogr2ogr` handles it fine.
3. Place at `backend/data/conservation/conservation_areas.geojson`
   (or `.shp` — update the `--file` argument accordingly)

**Licence:** Open Government Licence v3.0

---

## 5. Green Belt

**Used for:** greenbelt flag per postcode
**Script:** `scripts/ingest_greenbelt.py`

1. Go to: https://www.data.gov.uk/dataset/green-belt-england
2. Download the England-wide **shapefile**.
3. Extract and place at:
   - `backend/data/greenbelt/greenbelt.shp` (+ accompanying files)

**Licence:** Open Government Licence v3.0

---

## 6. Article 4 Direction Areas

**Used for:** Article 4 zone flag per postcode
**Script:** `scripts/ingest_article4.py`

1. Go to: https://www.data.gov.uk/dataset/article-4-direction-areas
2. Download the **GeoJSON** or **shapefile**.
3. Place at `backend/data/article4/article4_directions.geojson`

**Licence:** Open Government Licence v3.0

---

## Prerequisites before running ingestion scripts

### Install GDAL / ogr2ogr
The spatial ingestion scripts use `ogr2ogr` to load shapefiles into PostGIS.

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
Ensure your `.env` is filled in with the Supabase `DATABASE_URL`, then run:
```bash
python scripts/setup_db.py
```
This enables PostGIS and creates all required tables.

---

## Ingestion order

Run in this exact order:

```bash
# Spatial constraint layers
python scripts/ingest_flood.py \
    --fz2 data/flood/Flood_Zone_2.shp \
    --fz3 data/flood/Flood_Zone_3.shp

python scripts/ingest_conservation.py \
    --file data/conservation/conservation_areas.geojson

python scripts/ingest_greenbelt.py \
    --file data/greenbelt/greenbelt.shp

python scripts/ingest_article4.py \
    --file data/article4/article4_directions.geojson

# Price paid data
python scripts/ingest_price_paid.py \
    --csv data/price_paid/pp-complete.csv \
    --postcodes data/postcodes/ONSPD_latest.csv

# IBex planning applications
# Replace LA codes with your target boroughs (ONS Local Authority codes)
python scripts/ingest_ibex.py \
    --las E09000033,E09000022,E09000032 \
    --postcodes data/postcodes/ONSPD_latest.csv \
    --years 5
```

Once all ingestion is complete, proceed to the ML training guide.

---

## Finding Local Authority codes for IBex

Use ONS Local Authority codes (format: `E09xxxxxx` for London boroughs).

Common London boroughs:
| Borough | Code |
|---|---|
| Westminster | E09000033 |
| Camden | E09000007 |
| Hackney | E09000012 |
| Tower Hamlets | E09000030 |
| Southwark | E09000028 |
| Lambeth | E09000022 |
| Islington | E09000019 |

Full list: https://geoportal.statistics.gov.uk (search "Local Authority Districts")
