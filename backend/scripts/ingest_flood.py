"""
Ingest flood zone shapefiles into PostGIS.

Source: https://www.data.gov.uk/dataset/flood-risk-zones
Download the Flood Zone 2 and Flood Zone 3 shapefiles and place them in data/flood/

Usage:
    python scripts/ingest_flood.py --fz2 data/flood/Flood_Zone_2.shp \
                                   --fz3 data/flood/Flood_Zone_3.shp
"""
import argparse
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]


def ingest_shapefile(path: str, zone_number: int, db_url: str):
    print(f"Ingesting flood zone {zone_number} from {path}...")
    table = "flood_zones"
    mode = "create" if zone_number == 2 else "append"

    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        f"PG:{db_url}",
        path,
        "-nln", table,
        f"-{mode}",
        "-t_srs", "EPSG:4326",
        "-nlt", "MULTIPOLYGON",
        "-sql", f"SELECT geometry, {zone_number} AS zone_number FROM {table_name(path)}",
        "-lco", "GEOMETRY_NAME=geom",
    ]
    subprocess.run(cmd, check=True)
    print(f"  Done: flood zone {zone_number}")


def table_name(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def add_index(db_url: str):
    import asyncpg
    import asyncio

    async def _run():
        conn = await asyncpg.connect(db_url)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS flood_zones_geom_idx
            ON flood_zones USING GIST (geom);
        """)
        await conn.close()
        print("Spatial index created on flood_zones.")

    asyncio.run(_run())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fz2", required=True, help="Path to Flood Zone 2 shapefile")
    parser.add_argument("--fz3", required=True, help="Path to Flood Zone 3 shapefile")
    args = parser.parse_args()

    ingest_shapefile(args.fz2, 2, DB_URL)
    ingest_shapefile(args.fz3, 3, DB_URL)
    add_index(DB_URL)
