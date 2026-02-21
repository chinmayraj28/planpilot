"""
Ingest historical planning application data from the IBex Planning API.

Pulls applications for a given set of Local Authority codes, geocodes them
using a postcode → lat/lon lookup (ONSPD), and inserts into the
planning_applications table. Feature columns are left NULL at this stage —
run feature_engineering.py afterwards to populate them.

IBex API docs: https://ibexplanning.co.uk/api-docs (requires login)

Usage:
    python scripts/ingest_ibex.py \
        --las E09000033,E09000022 \
        --postcodes data/postcodes/ONSPD_latest.csv \
        --years 5
"""
import argparse
import asyncio
import asyncpg
import httpx
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]
IBEX_API_KEY = os.environ["IBEX_API_KEY"]
IBEX_BASE_URL = os.environ.get("IBEX_BASE_URL", "https://api.ibexplanning.co.uk/v1")

PAGE_SIZE = 100


def _ibex_headers() -> dict:
    return {
        "Authorization": f"Bearer {IBEX_API_KEY}",
        "Accept": "application/json",
    }


def _parse_decision(raw: str) -> str | None:
    """Normalise IBex decision strings to 'approved' or 'refused'."""
    if not raw:
        return None
    lower = raw.lower()
    if any(w in lower for w in ("approved", "grant", "permitted")):
        return "approved"
    if any(w in lower for w in ("refused", "reject", "denied")):
        return "refused"
    return None  # withdrawn, invalid, etc. — skip


async def fetch_applications(la_code: str, since: datetime, client: httpx.AsyncClient) -> list[dict]:
    """Fetch all planning applications for a local authority since a given date."""
    apps = []
    page = 1
    while True:
        params = {
            "local_authority": la_code,
            "decision_date_from": since.strftime("%Y-%m-%d"),
            "page": page,
            "per_page": PAGE_SIZE,
        }
        resp = await client.get(
            f"{IBEX_BASE_URL}/applications",
            params=params,
            headers=_ibex_headers(),
            timeout=30,
        )
        if resp.status_code == 404:
            break
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", data.get("data", []))
        if not results:
            break

        apps.extend(results)
        print(f"  LA {la_code}: page {page}, fetched {len(results)} apps (total so far: {len(apps)})")

        # Stop if we've received fewer than a full page
        if len(results) < PAGE_SIZE:
            break
        page += 1

    return apps


def build_postcode_lookup(postcode_csv: str) -> dict:
    print("Loading postcode lookup...")
    df = pd.read_csv(postcode_csv, usecols=["pcd", "lat", "long"], dtype=str)
    df["pcd"] = df["pcd"].str.replace(" ", "").str.upper()
    return df.set_index("pcd")[["lat", "long"]].to_dict("index")


async def insert_batch(conn: asyncpg.Connection, batch: list[tuple]):
    await conn.executemany("""
        INSERT INTO planning_applications
            (reference, postcode, decision, decision_date, decision_days, application_type, geom)
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
        ON CONFLICT (reference) DO NOTHING
    """, batch)


async def run(la_codes: list[str], postcode_csv: str, years: int):
    pc_lookup = build_postcode_lookup(postcode_csv)
    since = datetime.now() - timedelta(days=365 * years)

    conn = await asyncpg.connect(DB_URL)

    # Ensure unique index on reference to support ON CONFLICT
    await conn.execute("""
        ALTER TABLE planning_applications
        ADD COLUMN IF NOT EXISTS reference TEXT;

        CREATE UNIQUE INDEX IF NOT EXISTS planning_apps_reference_idx
        ON planning_applications (reference);
    """)

    async with httpx.AsyncClient() as client:
        for la_code in la_codes:
            print(f"\nFetching applications for LA: {la_code}")
            apps = await fetch_applications(la_code, since, client)
            print(f"  Total fetched: {len(apps)}")

            batch = []
            skipped = 0
            for app in apps:
                reference = app.get("reference") or app.get("app_ref") or app.get("id")
                postcode_raw = app.get("postcode") or app.get("site_postcode", "")
                postcode = postcode_raw.replace(" ", "").upper() if postcode_raw else ""
                decision_raw = app.get("decision") or app.get("decision_type", "")
                decision = _parse_decision(decision_raw)

                if not decision or not postcode:
                    skipped += 1
                    continue

                coords = pc_lookup.get(postcode)
                if not coords:
                    skipped += 1
                    continue

                decision_date_str = app.get("decision_date") or app.get("decided_at")
                try:
                    decision_date = datetime.strptime(decision_date_str[:10], "%Y-%m-%d").date()
                except (TypeError, ValueError):
                    skipped += 1
                    continue

                received_date_str = app.get("received_date") or app.get("validated_date")
                try:
                    received_date = datetime.strptime(received_date_str[:10], "%Y-%m-%d").date()
                    decision_days = (decision_date - received_date).days
                except (TypeError, ValueError):
                    decision_days = None

                application_type = app.get("application_type") or app.get("app_type", "")
                lon = float(coords["long"])
                lat = float(coords["lat"])

                batch.append((
                    str(reference),
                    postcode_raw.upper().strip(),
                    decision,
                    decision_date,
                    decision_days,
                    application_type,
                    lon,
                    lat,
                ))

                if len(batch) >= 500:
                    await insert_batch(conn, batch)
                    batch.clear()

            if batch:
                await insert_batch(conn, batch)

            print(f"  Inserted: {len(apps) - skipped}  |  Skipped: {skipped}")

    await conn.close()
    print("\nIBex ingestion complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--las", required=True, help="Comma-separated Local Authority codes e.g. E09000033,E09000022")
    parser.add_argument("--postcodes", required=True, help="Path to ONSPD CSV for lat/lon lookup")
    parser.add_argument("--years", type=int, default=5, help="How many years of history to pull (default: 5)")
    args = parser.parse_args()

    la_codes = [c.strip() for c in args.las.split(",")]
    asyncio.run(run(la_codes, args.postcodes, args.years))
