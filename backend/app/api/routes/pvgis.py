from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter()


@router.get('/pvgis')
async def proxy_pvgis(lat: float = Query(...), lon: float = Query(...), peakpower: int = Query(4), loss: int = Query(14)):
    url = f"https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat={lat}&lon={lon}&peakpower={peakpower}&loss={loss}&outputformat=json"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail='PVGIS upstream error')
            return resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail='PVGIS request failed')
