"""
Simple in-memory cache for AnalyzeResponse objects.
Entries expire after TTL_SECONDS to avoid stale data.
"""
import time
from app.schemas.models import AnalyzeResponse

TTL_SECONDS = 300  # 5 minutes

_store: dict[str, tuple[AnalyzeResponse, float]] = {}


def set_analysis(postcode: str, data: AnalyzeResponse) -> None:
    _store[_key(postcode)] = (data, time.monotonic())


def get_analysis(postcode: str) -> AnalyzeResponse | None:
    entry = _store.get(_key(postcode))
    if entry is None:
        return None
    data, ts = entry
    if time.monotonic() - ts > TTL_SECONDS:
        del _store[_key(postcode)]
        return None
    return data


def _key(postcode: str) -> str:
    return postcode.replace(" ", "").upper()
