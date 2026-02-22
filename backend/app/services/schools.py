import httpx
import math

_OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Radius in metres for the Overpass query
_RADIUS_M = 1200  # ~0.75 miles


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _school_type(tags: dict) -> str:
    """Derive a human-readable school type from OSM tags."""
    school_type = tags.get("school:type", "").lower()
    school_tag  = tags.get("school", "").lower()
    isced       = tags.get("isced:level", "")
    selective   = tags.get("school:selective", "").lower()
    operator_t  = tags.get("operator:type", "").lower()

    if selective == "yes":
        return "Grammar School"
    if school_type == "free":
        return "Free School"
    if school_type == "academy":
        phase = _school_phase(school_tag, isced)
        return f"{phase} Academy" if phase else "Academy"
    if operator_t == "private":
        return "Independent School"

    phase = _school_phase(school_tag, isced)
    if school_type == "community":
        return f"Community {phase}" if phase else "Community School"
    return phase or "School"


def _school_phase(school_tag: str, isced: str) -> str:
    if school_tag in ("primary",):
        return "Primary"
    if school_tag in ("secondary",):
        return "Secondary"
    if "0" in isced or "1" in isced:
        return "Primary"
    if "2" in isced or "3" in isced:
        return "Secondary"
    return ""


async def get_nearby_schools(lat: float, lon: float) -> list[dict]:
    """
    Fetch up to 5 nearby schools using the OpenStreetMap Overpass API.
    Returns real school data (name, type, distance) sorted by phase then distance.
    Note: Ofsted ratings are not available from OSM — to add them, load the DfE
    GIAS dataset into the schools table and enable the PostGIS query path.
    """
    query = (
        f"[out:json][timeout:12];"
        f"("
        f'node["amenity"="school"](around:{_RADIUS_M},{lat},{lon});'
        f'way["amenity"="school"](around:{_RADIUS_M},{lat},{lon});'
        f");"
        f"out center tags;"
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                _OVERPASS_URL,
                data={"data": query},
                timeout=14,
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
    except Exception:
        return []

    elements = data.get("elements", [])
    if not elements:
        return []

    results = []
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue

        # Coordinates — ways have a "center" sub-object
        s_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        s_lon = el.get("lon") or (el.get("center") or {}).get("lon")
        try:
            dist_m = _haversine_m(lat, lon, float(s_lat), float(s_lon))
        except (TypeError, ValueError):
            continue

        school_type = _school_type(tags)

        # Phase sort key: primary first, secondary second, others third
        phase = tags.get("school", "").lower()
        isced = tags.get("isced:level", "")
        if "primary" in phase or "0" in isced or ("1" in isced and "2" not in isced):
            phase_order = 0
        elif "secondary" in phase or "2" in isced or "3" in isced:
            phase_order = 1
        else:
            phase_order = 2

        results.append({
            "name": name,
            "type": school_type,
            "ofsted_rating": "N/A",
            "distance_m": round(dist_m),
            "_phase_order": phase_order,
        })

    # Sort: primary first, then secondary, then by distance within phase
    results.sort(key=lambda s: (s["_phase_order"], s["distance_m"]))

    # Strip internal sort key
    for r in results:
        del r["_phase_order"]

    return results[:5]
