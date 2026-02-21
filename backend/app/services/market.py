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
    and avg EPC rating from the EPC API.
    """
    price_data = await _get_price_metrics(pool, lon, lat)
    epc_rating = await _get_epc_rating(postcode)
    return {**price_data, "avg_epc_rating": epc_rating}


async def _get_price_metrics(pool: asyncpg.Pool, lon: float, lat: float) -> dict:
    query = """
        SELECT
            AVG(price_per_m2) AS avg_price_per_m2,
            (
                AVG(price_per_m2) FILTER (WHERE sale_date >= NOW() - INTERVAL '12 months') -
                AVG(price_per_m2) FILTER (WHERE sale_date BETWEEN NOW() - INTERVAL '24 months' AND NOW() - INTERVAL '12 months')
            ) /
            NULLIF(
                AVG(price_per_m2) FILTER (WHERE sale_date BETWEEN NOW() - INTERVAL '24 months' AND NOW() - INTERVAL '12 months'),
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
        "avg_price_per_m2": round(row["avg_price_per_m2"] or 0.0, 2),
        "price_trend_24m": round(row["price_trend_24m"] or 0.0, 4),
    }


async def _get_epc_rating(postcode: str) -> str:
    """Fetch average EPC rating from the DLUHC EPC API."""
    clean = postcode.replace(" ", "").upper()
    url = "https://epc.opendatacommunities.org/api/v1/domestic/search"
    params = {"postcode": clean, "size": 50}
    headers = {
        "Authorization": _epc_auth_header(),
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers=headers, timeout=10)
        if resp.status_code != 200:
            return "N/A"
        data = resp.json()

    rows = data.get("rows", [])
    if not rows:
        return "N/A"

    rating_map = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}
    reverse_map = {v: k for k, v in rating_map.items()}
    scores = [rating_map.get(r.get("current-energy-rating", ""), 0) for r in rows]
    valid = [s for s in scores if s > 0]
    if not valid:
        return "N/A"
    avg = round(sum(valid) / len(valid))
    return reverse_map.get(avg, "N/A")
