# ML Model Training Guide

This document explains how to train the XGBoost approval prediction model
and verify it is working correctly.

**Prerequisites:** All ingestion scripts must have been run successfully.
See `docs/data-acquisition.md` first.

---

## Overview

The model predicts the probability that a planning application will be approved,
given 10 features derived from spatial, planning, and market data.

| Feature | Source |
|---|---|
| `flood_zone` | Flood Risk Zones (PostGIS) |
| `in_conservation_area` | Conservation Areas (PostGIS) |
| `in_greenbelt` | Green Belt (PostGIS) |
| `in_article4_zone` | Article 4 Directions (PostGIS) |
| `local_approval_rate` | IBex historical applications (500m radius) |
| `avg_decision_time_days` | IBex historical applications (500m radius) |
| `similar_applications_nearby` | IBex historical applications (500m radius) |
| `avg_price_per_m2` | Land Registry Price Paid (500m radius) |
| `price_trend_24m` | Land Registry Price Paid (500m radius) |
| `avg_epc_rating` | EPC API (converted to numeric 1–7) |

**Target:** `approved` — 1 if the application was approved, 0 if refused.

---

## Step 1 — Compute features for historical applications

The IBex ingestion script loads raw application data (reference, postcode,
decision, dates). Before training, you must compute the 10 feature columns
for each row by joining against the spatial and market layers.

```bash
cd backend
source venv/bin/activate
python scripts/feature_engineering.py
```

Expected output:
```
Computing features for 12,453 applications...
  Progress: 500/12453  errors: 2
  Progress: 1000/12453  errors: 4
  ...
Done. Updated: 12,301  |  Errors/skipped: 152
You can now run: python scripts/train_model.py
```

**This step can take 10–30 minutes** depending on the number of applications
and database response times. Errors/skipped rows are expected — they are
applications where the postcode couldn't be geocoded or is outside the
coverage of the loaded spatial layers.

If you need to re-run it (e.g. after loading more data), it only processes
rows where `flood_zone IS NULL`, so it is safe to run multiple times.

---

## Step 2 — Train the model

```bash
python scripts/train_model.py
```

Expected output:
```
Fetching training data...
Loaded 12,301 records. Class balance: 73.42% approved

Training XGBoost model...
[0]     validation_0-logloss:0.62134
[50]    validation_0-logloss:0.48201
[100]   validation_0-logloss:0.43892
...
[299]   validation_0-logloss:0.38104

ROC-AUC: 0.8234

Feature importances:
  local_approval_rate                      0.3412
  flood_zone                               0.1823
  avg_price_per_m2                         0.1204
  in_conservation_area                     0.0987
  avg_decision_time_days                   0.0876
  in_greenbelt                             0.0654
  price_trend_24m                          0.0512
  similar_applications_nearby              0.0321
  in_article4_zone                         0.0143
  epc_score                                0.0068

Model saved to /path/to/backend/ml/planning_model.pkl
```

---

## What to look for

### ROC-AUC score
- **> 0.80** — good, model is useful
- **0.70–0.80** — acceptable for a first pass
- **< 0.70** — check data quality; likely too few training examples or
  noisy features

### Feature importances
`local_approval_rate` should be the top feature — it directly measures
how many applications in that area were historically approved. If a
completely different feature dominates, investigate the data.

### Class balance
If the dataset is heavily imbalanced (e.g. >90% approved), the model
may predict "approved" for everything. Aim for at least 20% refused
applications in your training set. If not, broaden the boroughs you
ingest from IBex (`--las` argument).

---

## Step 3 — Verify the model loads correctly

Start the FastAPI server and call the health endpoint:

```bash
uvicorn app.main:app --reload
```

```bash
curl http://localhost:8000/api/v1/health
```

Expected:
```json
{
  "status": "ok",
  "model_loaded": true,
  "db_connected": true
}
```

If `model_loaded` is `false`, check that `ml/planning_model.pkl` exists:
```bash
ls -lh backend/ml/planning_model.pkl
```

---

## Step 4 — Test a live prediction

Get a Supabase JWT (sign in via your frontend or Supabase dashboard), then:

```bash
curl "http://localhost:8000/api/v1/analyze?postcode=EC1A1BB" \
  -H "Authorization: Bearer <your-jwt>"
```

Check that `ml_prediction.approval_probability` is a number between 0 and 1,
and is not always the same value (which would indicate the model isn't
actually being used).

---

## Re-training

Re-train whenever you ingest new IBex data from additional boroughs or years:

```bash
python scripts/feature_engineering.py   # compute features for new rows only
python scripts/train_model.py           # retrain on full dataset
```

The server picks up the new model automatically on next restart. If the
server is already running, restart it:

```bash
# Ctrl+C to stop, then:
uvicorn app.main:app --reload
```

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `Loaded 0 records` | Feature engineering not run | Run `feature_engineering.py` first |
| ROC-AUC < 0.65 | Too few training examples | Ingest more boroughs via `ingest_ibex.py` |
| `model_loaded: false` | `.pkl` file missing or wrong path | Check `backend/ml/planning_model.pkl` exists |
| All probabilities ~0.73 | Model defaulting to class mean | Training data may be too small or homogeneous |
| Feature engineering slow | Large dataset + remote DB | Normal — wait it out, or run during ingestion overnight |
