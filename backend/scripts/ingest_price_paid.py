"""
Ingest Land Registry Price Paid Data into PostGIS.

Source: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
Download the full dataset CSV (pp-complete.csv) and place it in data/price_paid/

The script geocodes postcodes using a local postcode → lat/lon lookup
(ONS postcode directory) to avoid hitting the OS API for every row.

Usage:
    python scripts/ingest_price_paid.py \
        --csv data/price_paid/pp-complete.csv \
        --postcodes data/postcodes/ONSPD_latest.csv
"""
import argparse
import asyncio
import asyncpg
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

PP_COLUMNS = [
    "transaction_id", "price", "transfer_date", "postcode",
    "property_type", "new_build", "tenure", "paon", "saon",
    "street", "locality", "town", "district", "county",
    "ppd_category", "record_status",
]


async def create_table(conn: asyncpg.Connection):
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS price_paid (
            id SERIAL PRIMARY KEY,
            postcode TEXT,
            price INTEGER,
            sale_date DATE,
            property_type TEXT,
            price_per_m2 NUMERIC,
            geom GEOMETRY(Point, 4326)
        );
        CREATE INDEX IF NOT EXISTS price_paid_geom_idx ON price_paid USING GIST (geom);
        CREATE INDEX IF NOT EXISTS price_paid_postcode_idx ON price_paid (postcode);
    """)


async def ingest(csv_path: str, postcode_csv: str, db_url: str):
    print("Loading postcode → lat/lon lookup...")
    # ONSPD uses 'pcds' for the formatted postcode (e.g. "SW1A 1AA")
    pc = pd.read_csv(postcode_csv, usecols=["pcds", "lat", "long"], dtype=str)
    pc["pcds"] = pc["pcds"].str.replace(" ", "").str.upper()
    pc_lookup = pc.set_index("pcds")[["lat", "long"]].to_dict("index")

    print("Loading Price Paid CSV (this may take a while)...")
    df = pd.read_csv(csv_path, header=None, names=PP_COLUMNS, dtype=str)
    df["postcode_clean"] = df["postcode"].str.replace(" ", "").str.upper()
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["sale_date"] = pd.to_datetime(df["transfer_date"], errors="coerce")

    # Only last 5 years
    cutoff = pd.Timestamp.now() - pd.DateOffset(years=5)
    df = df[df["sale_date"] >= cutoff].dropna(subset=["price", "sale_date", "postcode_clean"])

    print(f"Inserting {len(df):,} rows...")
    conn = await asyncpg.connect(db_url)
    await create_table(conn)

    batch = []
    for _, row in df.iterrows():
        pc_key = row["postcode_clean"]
        coords = pc_lookup.get(pc_key)
        if not coords:
            continue
        lat, lon = float(coords["lat"]), float(coords["long"])
        batch.append((
            row["postcode"],
            int(row["price"]),
            row["sale_date"].date(),
            row["property_type"],
            None,   # price_per_m2 — populated later if floor area data available
            f"SRID=4326;POINT({lon} {lat})",
        ))
        if len(batch) >= 5000:
            await conn.executemany("""
                INSERT INTO price_paid (postcode, price, sale_date, property_type, price_per_m2, geom)
                VALUES ($1, $2, $3, $4, $5, ST_GeomFromEWKT($6))
            """, batch)
            batch.clear()

    if batch:
        await conn.executemany("""
            INSERT INTO price_paid (postcode, price, sale_date, property_type, price_per_m2, geom)
            VALUES ($1, $2, $3, $4, $5, ST_GeomFromEWKT($6))
        """, batch)

    await conn.close()
    print("Price Paid ingestion complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to pp-complete.csv")
    parser.add_argument("--postcodes", required=True, help="Path to ONSPD CSV for lat/lon lookup")
    args = parser.parse_args()
    asyncio.run(ingest(args.csv, args.postcodes, DB_URL))
