"""
Ingest greenbelt boundaries into PostGIS.

Source: https://www.data.gov.uk/dataset/green-belt-england
Download the shapefile and place it in data/greenbelt/

Usage:
    python scripts/ingest_greenbelt.py --file data/greenbelt/greenbelt.shp
"""
import argparse
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]


def ingest(path: str, db_url: str):
    print(f"Ingesting greenbelt from {path}...")
    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        f"PG:{db_url}",
        path,
        "-nln", "greenbelt_areas",
        "-overwrite",
        "-t_srs", "EPSG:4326",
        "-nlt", "MULTIPOLYGON",
        "-lco", "GEOMETRY_NAME=geom",
    ]
    subprocess.run(cmd, check=True)
    print("Done.")


def add_index(db_url: str):
    import asyncpg, asyncio

    async def _run():
        conn = await asyncpg.connect(db_url)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS greenbelt_areas_geom_idx
            ON greenbelt_areas USING GIST (geom);
        """)
        await conn.close()
        print("Spatial index created on greenbelt_areas.")

    asyncio.run(_run())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    args = parser.parse_args()
    ingest(args.file, DB_URL)
    add_index(DB_URL)
