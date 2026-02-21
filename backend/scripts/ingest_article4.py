"""
Ingest Article 4 direction zones into PostGIS.

Source: https://www.data.gov.uk/dataset/article-4-direction-areas
Download the GeoJSON or shapefile and place it in data/article4/

Usage:
    python scripts/ingest_article4.py --file data/article4/article4_directions.geojson
"""
import argparse
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]


def ingest(path: str, db_url: str):
    print(f"Ingesting Article 4 zones from {path}...")
    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        f"PG:{db_url}",
        path,
        "-nln", "article4_zones",
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
            CREATE INDEX IF NOT EXISTS article4_zones_geom_idx
            ON article4_zones USING GIST (geom);
        """)
        await conn.close()
        print("Spatial index created on article4_zones.")

    asyncio.run(_run())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    args = parser.parse_args()
    ingest(args.file, DB_URL)
    add_index(DB_URL)
