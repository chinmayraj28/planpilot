"""
Compute and write ML feature columns for all rows in planning_applications.

For each application, this script runs the same spatial and market queries
used at inference time, then writes the results back to the feature columns.
This is the bridge between raw IBex data and the ML training step.

Run after: ingest_ibex.py, ingest_flood.py, ingest_conservation.py,
           ingest_greenbelt.py, ingest_article4.py, ingest_price_paid.py

Usage:
    python scripts/feature_engineering.py [--batch-size 500]
"""
import argparse
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

EPC_MAP = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}

# Spatial queries run per-application using its stored geom
CONSTRAINT_QUERY = """
    SELECT
        COALESCE(
            (SELECT zone_number FROM flood_zones
             WHERE ST_Contains(geom, app.geom)
             ORDER BY zone_number DESC LIMIT 1),
            1
        ) AS flood_zone,
        EXISTS(
            SELECT 1 FROM conservation_areas WHERE ST_Contains(geom, app.geom)
        ) AS in_conservation_area,
        EXISTS(
            SELECT 1 FROM greenbelt_areas WHERE ST_Contains(geom, app.geom)
        ) AS in_greenbelt,
        EXISTS(
            SELECT 1 FROM article4_zones WHERE ST_Contains(geom, app.geom)
        ) AS in_article4_zone
    FROM (SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326) AS geom) app
"""

PLANNING_METRICS_QUERY = """
    SELECT
        COUNT(*) FILTER (WHERE decision = 'approved')::float /
            NULLIF(COUNT(*), 0) AS local_approval_rate,
        AVG(decision_days) AS avg_decision_time_days,
        COUNT(*) AS similar_applications_nearby
    FROM planning_applications
    WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        500
    )
    -- Exclude the application itself by using decision_date before this app's date
    AND decision_date < $3
    AND decision_date >= $3 - INTERVAL '5 years'
"""

MARKET_QUERY = """
    SELECT
        AVG(price_per_m2) AS avg_price_per_m2,
        (
            AVG(price_per_m2) FILTER (WHERE sale_date >= $3::date - INTERVAL '12 months') -
            AVG(price_per_m2) FILTER (WHERE sale_date BETWEEN $3::date - INTERVAL '24 months'
                                                           AND $3::date - INTERVAL '12 months')
        ) /
        NULLIF(
            AVG(price_per_m2) FILTER (WHERE sale_date BETWEEN $3::date - INTERVAL '24 months'
                                                           AND $3::date - INTERVAL '12 months'),
            0
        ) AS price_trend_24m
    FROM price_paid
    WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        500
    )
    AND sale_date BETWEEN $3::date - INTERVAL '24 months' AND $3::date
"""

UPDATE_QUERY = """
    UPDATE planning_applications SET
        flood_zone                  = $1,
        in_conservation_area        = $2,
        in_greenbelt                = $3,
        in_article4_zone            = $4,
        local_approval_rate         = $5,
        avg_decision_time_days      = $6,
        similar_applications_nearby = $7,
        avg_price_per_m2            = $8,
        price_trend_24m             = $9,
        avg_epc_rating              = $10
    WHERE id = $11
"""


async def compute_features_for_app(conn: asyncpg.Connection, app: asyncpg.Record) -> tuple | None:
    app_id = app["id"]
    lon = app["lon"]
    lat = app["lat"]
    decision_date = app["decision_date"]

    try:
        c = await conn.fetchrow(CONSTRAINT_QUERY, lon, lat)
        p = await conn.fetchrow(PLANNING_METRICS_QUERY, lon, lat, decision_date)
        m = await conn.fetchrow(MARKET_QUERY, lon, lat, decision_date)
    except Exception as e:
        print(f"  [WARN] app {app_id}: query error — {e}")
        return None

    avg_price = float(m["avg_price_per_m2"] or 0.0)
    price_trend = float(m["price_trend_24m"] or 0.0)

    # EPC rating: use "D" (score 4) as neutral default when price data is sparse
    avg_epc = "D"

    return (
        int(c["flood_zone"]),
        bool(c["in_conservation_area"]),
        bool(c["in_greenbelt"]),
        bool(c["in_article4_zone"]),
        round(float(p["local_approval_rate"] or 0.0), 4),
        round(float(p["avg_decision_time_days"] or 0.0), 1),
        int(p["similar_applications_nearby"] or 0),
        round(avg_price, 2),
        round(price_trend, 4),
        avg_epc,
        app_id,
    )


async def run(batch_size: int):
    conn = await asyncpg.connect(DB_URL)

    # Fetch all apps that still need feature computation
    apps = await conn.fetch("""
        SELECT
            id,
            ST_X(geom) AS lon,
            ST_Y(geom) AS lat,
            decision_date
        FROM planning_applications
        WHERE geom IS NOT NULL
          AND decision_date IS NOT NULL
          AND flood_zone IS NULL
        ORDER BY id
    """)

    total = len(apps)
    print(f"Computing features for {total:,} applications...")

    done = 0
    errors = 0
    update_batch = []

    for app in apps:
        features = await compute_features_for_app(conn, app)
        if features is None:
            errors += 1
            continue

        update_batch.append(features)
        done += 1

        if len(update_batch) >= batch_size:
            await conn.executemany(UPDATE_QUERY, update_batch)
            update_batch.clear()
            print(f"  Progress: {done:,}/{total:,}  errors: {errors}")

    if update_batch:
        await conn.executemany(UPDATE_QUERY, update_batch)

    await conn.close()
    print(f"\nDone. Updated: {done:,}  |  Errors/skipped: {errors}")
    print("You can now run: python scripts/train_model.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=500,
                        help="Number of UPDATE statements per DB round-trip (default: 500)")
    args = parser.parse_args()
    asyncio.run(run(args.batch_size))
