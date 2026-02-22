import asyncio
import asyncpg
import base64
import httpx
from app.config import settings


def _epc_auth_header() -> str:
    """EPC API uses HTTP Basic auth with base64(email:api_key)."""
    credentials = f"{settings.epc_api_email}:{settings.epc_api_key}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


async def get_market_metrics(pool: asyncpg.Pool, lat: float, lon: float, postcode: str) -> dict:
    """
    Fetch avg price per m2, 24-month price trend from Price Paid Data,
    avg EPC rating from the EPC API, and 5 recent comparable sales.
    """
    price_data, epc_rating, comps = await asyncio.gather(
        _get_price_metrics(pool, lon, lat),
        _get_epc_rating(postcode),
        _get_comparable_sales(pool, lon, lat),
    )
    return {**price_data, "avg_epc_rating": epc_rating, "comparable_sales": comps}


async def _get_price_metrics(pool: asyncpg.Pool, lon: float, lat: float) -> dict:
    query = """
        SELECT
            AVG(price) / 100.0 AS avg_price_per_m2,
            (
                AVG(price) FILTER (WHERE sale_date >= NOW() - INTERVAL '12 months') -
                AVG(price) FILTER (WHERE sale_date BETWEEN NOW() - INTERVAL '24 months' AND NOW() - INTERVAL '12 months')
            ) /
            NULLIF(
                AVG(price) FILTER (WHERE sale_date BETWEEN NOW() - INTERVAL '24 months' AND NOW() - INTERVAL '12 months'),
                0
            ) AS price_trend_24m
        FROM price_paid
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            500
        )
        AND sale_date >= NOW() - INTERVAL '24 months'
    """
    row = await pool.fetchrow(query, lon, lat)
    return {
        "avg_price_per_m2": round(float(row["avg_price_per_m2"] or 0.0), 2),
        "price_trend_24m": round(float(row["price_trend_24m"] or 0.0), 4),
    }


async def _get_comparable_sales(pool: asyncpg.Pool, lon: float, lat: float) -> list[dict]:
    """Return up to 5 most recent property sales within 500m."""
    query = """
        SELECT
            COALESCE(postcode, 'Unknown') AS postcode,
            price,
            TO_CHAR(sale_date, 'YYYY-MM-DD') AS sale_date
        FROM price_paid
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            500
        )
        AND sale_date IS NOT NULL
        ORDER BY sale_date DESC
        LIMIT 5
    """
    rows = await pool.fetch(query, lon, lat)
    return [
        {
            "postcode": row["postcode"],
            "price": float(row["price"]),
            "sale_date": row["sale_date"],
        }
        for row in rows
    ]


async def _fetch_epc_rows(client: httpx.AsyncClient, postcode_query: str, headers: dict) -> list:
    """Hit the EPC API for a given postcode string; return rows list (may be empty)."""
    url = "https://epc.opendatacommunities.org/api/v1/domestic/search"
    try:
        resp = await client.get(
            url,
            params={"postcode": postcode_query, "size": 50},
            headers=headers,
            timeout=10,
        )
        if resp.status_code != 200 or not resp.content:
            return []
        return resp.json().get("rows", [])
    except Exception:
        return []


async def _get_epc_rating(postcode: str) -> str:
    """
    Fetch average EPC rating from the DLUHC EPC API.
    Tries the full postcode first; falls back to just the outward code
    (e.g. 'SW9') if the full postcode returns no certificates.
    """
    postcode = postcode.strip().upper()
    # outward code = everything before the final space (or last 3 chars stripped)
    parts = postcode.split()
    outward = parts[0] if len(parts) >= 2 else postcode[:-3].strip()

    headers = {
        "Authorization": _epc_auth_header(),
        "Accept": "application/json",
    }

    rating_map = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}
    reverse_map = {v: k for k, v in rating_map.items()}

    async with httpx.AsyncClient() as client:
        # 1st attempt: full postcode (e.g. "SW9 8JH")
        rows = await _fetch_epc_rows(client, postcode, headers)

        # 2nd attempt: outward code only (e.g. "SW9") — gives district-level average
        if not rows:
            rows = await _fetch_epc_rows(client, outward, headers)

    if not rows:
        return "N/A"

    scores = [rating_map.get(r.get("current-energy-rating", ""), 0) for r in rows]
    valid = [s for s in scores if s > 0]
    if not valid:
        return "N/A"
    avg = round(sum(valid) / len(valid))
    return reverse_map.get(avg, "N/A")
