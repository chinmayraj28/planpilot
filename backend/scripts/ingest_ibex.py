"""
Ingest historical planning application data from the IBex Planning API.

Pulls applications for given council IDs and inserts into the
planning_applications table. Geometry is returned in BNG (EPSG:27700) and
converted to WGS84 centroids via PostGIS.

Feature columns are left NULL at this stage — run feature_engineering.py
afterwards to populate them.

Available London boroughs:
    22 = Bexley       24 = Enfield      26 = Lambeth
    23 = Bromley      25 = Royal Greenwich   27 = Lewisham

Usage:
    python scripts/ingest_ibex.py --councils 25,26,27 --years 5
"""
import argparse
import asyncio
import asyncpg
import httpx
import re
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv
import os

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]
IBEX_API_KEY = os.environ["IBEX_API_KEY"]
IBEX_BASE_URL = os.environ.get("IBEX_BASE_URL", "https://ibex.seractech.co.uk")

# Regex to extract UK postcode from the end of a raw address string
_POSTCODE_RE = re.compile(r"([A-Z]{1,2}\d[\dA-Z]?\s?\d[A-Z]{2})$", re.IGNORECASE)


def _ibex_headers() -> dict:
    return {
        "Authorization": f"Bearer {IBEX_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _parse_decision(raw: str) -> str | None:
    """Normalise IBex normalised_decision to 'approved' or 'refused'."""
    if not raw:
        return None
    lower = raw.lower()
    if "approved" in lower or "grant" in lower or "permitted" in lower:
        return "approved"
    if "refused" in lower or "reject" in lower or "denied" in lower:
        return "refused"
    return None


def _extract_postcode(raw_address: str | None) -> str | None:
    if not raw_address:
        return None
    m = _POSTCODE_RE.search(raw_address.strip())
    if m:
        return m.group(1).upper().replace(" ", "")
    return None


async def fetch_month(
    council_ids: list[int],
    date_from: date,
    date_to: date,
    client: httpx.AsyncClient,
) -> list[dict]:
    """Fetch applications for a list of councils within a date window."""
    body = {
        "input": {
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "council_id": council_ids,
        },
        "filters": {
            "normalised_decision": ["Approved", "Refused"],
        },
    }
    resp = await client.post(
        f"{IBEX_BASE_URL}/applications",
        json=body,
        headers=_ibex_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


async def insert_batch(conn: asyncpg.Connection, batch: list[tuple]):
    """Insert records; geometry is BNG WKT → PostGIS centroid → WGS84."""
    await conn.executemany("""
        INSERT INTO planning_applications
            (reference, postcode, decision, decision_date, decision_days,
             application_type, geom)
        VALUES (
            $1, $2, $3, $4, $5, $6,
            ST_Transform(ST_Centroid(ST_GeomFromText($7, 27700)), 4326)
        )
        ON CONFLICT (reference) DO NOTHING
    """, batch)


async def run(council_ids: list[int], years: int):
    conn = await asyncpg.connect(DB_URL)

    # Ensure unique index on reference
    await conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS planning_apps_reference_idx
        ON planning_applications (reference);
    """)

    end_date = date.today()
    start_date = end_date - relativedelta(years=years)

    total_inserted = 0
    total_skipped = 0

    async with httpx.AsyncClient() as client:
        # Chunk by month to stay well under the 1000-record API limit
        chunk_start = start_date
        while chunk_start < end_date:
            chunk_end = min(chunk_start + relativedelta(months=1) - timedelta(days=1), end_date)

            print(f"Fetching {chunk_start} → {chunk_end} for councils {council_ids}...")
            try:
                apps = await fetch_month(council_ids, chunk_start, chunk_end, client)
            except httpx.HTTPStatusError as e:
                print(f"  HTTP {e.response.status_code} — skipping chunk")
                chunk_start += relativedelta(months=1)
                continue

            batch = []
            skipped = 0
            for app in apps:
                reference = app.get("planning_reference") or app.get("reference")
                if not reference:
                    skipped += 1
                    continue

                decision = _parse_decision(
                    app.get("normalised_decision") or app.get("decision", "")
                )
                if not decision:
                    skipped += 1
                    continue

                geometry = app.get("geometry")
                if not geometry:
                    skipped += 1
                    continue

                # Dates
                try:
                    decision_date = date.fromisoformat(app["decided_date"][:10])
                except (KeyError, TypeError, ValueError):
                    skipped += 1
                    continue

                try:
                    application_date = date.fromisoformat(app["application_date"][:10])
                    decision_days = (decision_date - application_date).days
                except (KeyError, TypeError, ValueError):
                    decision_days = None

                postcode = _extract_postcode(app.get("raw_address"))
                app_type = app.get("normalised_application_type") or app.get("raw_application_type", "")

                batch.append((
                    str(reference),
                    postcode,
                    decision,
                    decision_date,
                    decision_days,
                    app_type,
                    geometry,      # WKT BNG polygon — converted in SQL
                ))

            if batch:
                await insert_batch(conn, batch)
                total_inserted += len(batch)

            total_skipped += skipped
            print(f"  Inserted: {len(batch)}  |  Skipped: {skipped}")
            chunk_start += relativedelta(months=1)

    await conn.close()
    print(f"\nIBex ingestion complete. Total inserted: {total_inserted}  |  Total skipped: {total_skipped}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--councils",
        default="25,26,27",
        help="Comma-separated IBex council IDs (default: 25=Greenwich,26=Lambeth,27=Lewisham)"
    )
    parser.add_argument(
        "--years",
        type=int,
        default=5,
        help="Years of history to pull (default: 5)"
    )
    args = parser.parse_args()

    council_ids = [int(c.strip()) for c in args.councils.split(",")]
    asyncio.run(run(council_ids, args.years))
