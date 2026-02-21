"""
Compute and write ML feature columns for all rows in planning_applications.

Runs in two phases:
  Phase 1 (fast, bulk SQL): constraint flags + planning history metrics
  Phase 2 (optional, slow): market price metrics from price_paid
             Skip phase 2 with --skip-market for faster training data prep.
             Market metrics are computed live at inference time anyway.

Run after: ingest_ibex.py and all spatial layer ingestion scripts.

Usage:
    python scripts/feature_engineering.py              # full run
    python scripts/feature_engineering.py --skip-market  # fast run (~5 min)
"""
import argparse
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]


async def run(chunk_size: int, skip_market: bool):
    conn = await asyncpg.connect(DB_URL)
    await conn.execute("SET statement_timeout = 0")

    id_rows = await conn.fetch("""
        SELECT id FROM planning_applications
        WHERE flood_zone IS NULL AND geom IS NOT NULL
        ORDER BY id
    """)
    ids = [r["id"] for r in id_rows]
    total = len(ids)
    print(f"Computing features for {total:,} applications (chunk={chunk_size}, skip_market={skip_market})...")

    done = 0
    for i in range(0, total, chunk_size):
        chunk_ids = ids[i : i + chunk_size]
        id_list = ",".join(str(x) for x in chunk_ids)

        # ── Step 1: Spatial constraint flags (fast with GIST index) ──────────
        await conn.execute(f"""
            UPDATE planning_applications a
            SET
                flood_zone = COALESCE(
                    (SELECT fz.zone_number
                     FROM flood_zones fz
                     WHERE ST_Contains(fz.geom, a.geom)
                     ORDER BY fz.zone_number DESC LIMIT 1),
                    1
                ),
                in_conservation_area = EXISTS(
                    SELECT 1 FROM conservation_areas ca WHERE ST_Contains(ca.geom, a.geom)
                ),
                in_greenbelt = EXISTS(
                    SELECT 1 FROM greenbelt_areas gb WHERE ST_Contains(gb.geom, a.geom)
                ),
                in_article4_zone = EXISTS(
                    SELECT 1 FROM article4_zones a4 WHERE ST_Contains(a4.geom, a.geom)
                )
            WHERE a.id IN ({id_list})
        """)

        # ── Step 2: Planning history metrics (medium — self-join on 36k rows) ─
        await conn.execute(f"""
            UPDATE planning_applications a
            SET
                local_approval_rate         = m.approval_rate,
                avg_decision_time_days      = m.avg_days,
                similar_applications_nearby = m.count_nearby
            FROM (
                SELECT
                    a2.id,
                    COUNT(*) FILTER (WHERE b.decision = 'approved')::float
                        / NULLIF(COUNT(*), 0)    AS approval_rate,
                    AVG(b.decision_days)         AS avg_days,
                    COUNT(*)                     AS count_nearby
                FROM planning_applications a2
                JOIN planning_applications b
                    ON ST_DWithin(a2.geom::geography, b.geom::geography, 500)
                   AND b.id <> a2.id
                   AND b.decision_date < a2.decision_date
                   AND b.decision_date >= a2.decision_date - INTERVAL '5 years'
                WHERE a2.id IN ({id_list})
                  AND a2.geom IS NOT NULL
                  AND a2.decision_date IS NOT NULL
                GROUP BY a2.id
            ) m
            WHERE a.id = m.id
        """)

        if not skip_market:
            # ── Step 3: Market price metrics (slow — joins 4.6M price_paid rows) ─
            await conn.execute(f"""
                UPDATE planning_applications a
                SET
                    avg_price_per_m2 = m.avg_price,
                    price_trend_24m  = m.trend
                FROM (
                    SELECT
                        a2.id,
                        AVG(p.price) / 100.0    AS avg_price,
                        (
                            AVG(p.price) FILTER (
                                WHERE p.sale_date >= a2.decision_date - INTERVAL '12 months'
                            ) -
                            AVG(p.price) FILTER (
                                WHERE p.sale_date BETWEEN a2.decision_date - INTERVAL '24 months'
                                                      AND a2.decision_date - INTERVAL '12 months'
                            )
                        ) / NULLIF(
                            AVG(p.price) FILTER (
                                WHERE p.sale_date BETWEEN a2.decision_date - INTERVAL '24 months'
                                                      AND a2.decision_date - INTERVAL '12 months'
                            ),
                            0
                        )                       AS trend
                    FROM planning_applications a2
                    JOIN price_paid p
                        ON ST_DWithin(a2.geom::geography, p.geom::geography, 500)
                       AND p.sale_date BETWEEN a2.decision_date - INTERVAL '24 months'
                                           AND a2.decision_date
                    WHERE a2.id IN ({id_list})
                      AND a2.geom IS NOT NULL
                      AND a2.decision_date IS NOT NULL
                    GROUP BY a2.id
                ) m
                WHERE a.id = m.id
            """)

        done += len(chunk_ids)
        pct = done / total * 100
        print(f"  Progress: {done:,}/{total:,} ({pct:.0f}%)")

    # Fill defaults for any rows with missing values
    await conn.execute("""
        UPDATE planning_applications
        SET
            local_approval_rate         = COALESCE(local_approval_rate, 0.75),
            avg_decision_time_days      = COALESCE(avg_decision_time_days, 60),
            similar_applications_nearby = COALESCE(similar_applications_nearby, 0),
            avg_price_per_m2            = COALESCE(avg_price_per_m2, 0),
            price_trend_24m             = COALESCE(price_trend_24m, 0),
            avg_epc_rating              = COALESCE(avg_epc_rating, 'D')
        WHERE flood_zone IS NOT NULL
    """)

    ready = await conn.fetchval(
        "SELECT COUNT(*) FROM planning_applications WHERE flood_zone IS NOT NULL AND local_approval_rate IS NOT NULL"
    )
    print(f"\nDone. {ready:,} rows ready for training.")
    print("Run next: python scripts/train_model.py")
    await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--chunk", type=int, default=5000,
                        help="IDs per batch (default: 5000)")
    parser.add_argument("--skip-market", action="store_true",
                        help="Skip market price metrics (much faster, recommended for hackathon)")
    args = parser.parse_args()
    asyncio.run(run(args.chunk, args.skip_market))
