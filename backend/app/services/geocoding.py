import httpx


class GeocodeResult:
    def __init__(self, lat: float, lon: float, district: str, ward: str):
        self.lat = lat
        self.lon = lon
        self.district = district
        self.ward = ward


async def geocode_postcode(postcode: str) -> GeocodeResult:
    """
    Convert a UK postcode to WGS84 lat/lon using postcodes.io.

    Free, no API key required, returns lat/lon directly.
    Docs: https://postcodes.io
    """
    clean = postcode.replace(" ", "").upper()
    url = f"https://api.postcodes.io/postcodes/{clean}"

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10)
        if resp.status_code == 404:
            raise ValueError(f"Postcode not found: {postcode}")
        if resp.status_code == 400:
            raise ValueError(f"Invalid postcode: {postcode}")
        resp.raise_for_status()
        data = resp.json()

    result = data["result"]
    return GeocodeResult(
        lat=result["latitude"],
        lon=result["longitude"],
        district=result.get("admin_district") or result.get("parliamentary_constituency") or "",
        ward=result.get("admin_ward") or "",
    )
