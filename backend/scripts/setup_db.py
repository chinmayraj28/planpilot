"""
One-time database setup: enable PostGIS and create the planning_applications table.

Run this first before any ingestion scripts.

Usage:
    python scripts/setup_db.py
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]


async def setup():
    conn = await asyncpg.connect(DB_URL)

    print("Enabling PostGIS extension...")
    await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    print("Creating planning_applications table...")
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS planning_applications (
            id SERIAL PRIMARY KEY,
            reference TEXT,
            postcode TEXT,
            decision TEXT,          -- 'approved' | 'refused'
            decision_date DATE,
            decision_days INTEGER,
            application_type TEXT,
            geom GEOMETRY(Point, 4326),

            -- Pre-computed features (populated by feature engineering step)
            flood_zone INTEGER,
            in_conservation_area BOOLEAN,
            in_greenbelt BOOLEAN,
            in_article4_zone BOOLEAN,
            local_approval_rate NUMERIC,
            avg_decision_time_days NUMERIC,
            similar_applications_nearby INTEGER,
            avg_price_per_m2 NUMERIC,
            price_trend_24m NUMERIC,
            avg_epc_rating TEXT
        );

        CREATE INDEX IF NOT EXISTS planning_apps_geom_idx
            ON planning_applications USING GIST (geom);

        CREATE INDEX IF NOT EXISTS planning_apps_decision_date_idx
            ON planning_applications (decision_date);
    """)

    print("All tables and indexes created.")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(setup())
