"""
Ingest flood risk data from the Environment Agency RoFRS (Risk of Flooding
from Rivers and Sea) shapefile into PostGIS.

The RoFRS dataset uses a 4-band probability field (PROB_4BAND) which we map
to our flood_zone scale:
    High        → zone 3  (high risk, most restrictive in planning)
    Medium      → zone 2  (medium risk)
    Low         → zone 1  (treated as low risk)
    Very Low    → zone 1  (treated as low risk)

Source: Environment Agency — Risk of Flooding from Rivers and Sea
File:   data/flood/RoFRS_London.shp

Usage:
    python scripts/ingest_flood.py --file data/flood/RoFRS_London.shp
"""
import argparse
import subprocess
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

PROB_TO_ZONE = {
    "High":     3,
    "Medium":   2,
    "Low":      1,
    "Very Low": 1,
}


def create_flood_table(db_url: str):
    """Create the flood_zones table with zone_number column via ogr2ogr + SQL."""
    # First load raw geometries into a staging table
    print("Loading RoFRS shapefile into staging table...")
    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        f"PG:{db_url}",
        args_path,
        "-nln", "flood_zones_staging",
        "-overwrite",
        "-t_srs", "EPSG:4326",
        "-nlt", "MULTIPOLYGON",
        "-lco", "GEOMETRY_NAME=geom",
        "-lco", "PRECISION=NO",   # prevents numeric overflow on SHAPE_Area/SHAPE_Leng
    ]
    subprocess.run(cmd, check=True)
    print("Staging load complete.")


async def transform_to_flood_zones(db_url: str):
    """Map PROB_4BAND to zone_number and populate the final flood_zones table."""
    conn = await asyncpg.connect(db_url)

    print("Creating flood_zones table from staging...")
    await conn.execute("""
        DROP TABLE IF EXISTS flood_zones;

        CREATE TABLE flood_zones AS
        SELECT
            geom,
            CASE prob_4band
                WHEN 'High'     THEN 3
                WHEN 'Medium'   THEN 2
                ELSE 1
            END AS zone_number
        FROM flood_zones_staging;

        CREATE INDEX flood_zones_geom_idx ON flood_zones USING GIST (geom);

        DROP TABLE flood_zones_staging;
    """)

    counts = await conn.fetch("""
        SELECT zone_number, COUNT(*) FROM flood_zones GROUP BY zone_number ORDER BY zone_number
    """)
    print("flood_zones populated:")
    for row in counts:
        label = {3: "High (zone 3)", 2: "Medium (zone 2)", 1: "Low/Very Low (zone 1)"}
        print(f"  {label.get(row['zone_number'], row['zone_number'])}: {row['count']:,} polygons")

    await conn.close()


# Module-level reference so subprocess function can see the path
args_path = None


def ingest(path: str, db_url: str):
    global args_path
    args_path = path

    create_flood_table(db_url)
    asyncio.run(transform_to_flood_zones(db_url))
    print("Flood risk ingestion complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--file",
        required=True,
        help="Path to RoFRS shapefile e.g. data/flood/RoFRS_London.shp"
    )
    args = parser.parse_args()
    ingest(args.file, DB_URL)
