import asyncpg


async def get_planning_metrics(pool: asyncpg.Pool, lat: float, lon: float, radius_m: int = 500) -> dict:
    """
    Compute local planning metrics from historical IBex application data
    within a given radius (default 500m).
    """
    query = """
        SELECT
            COUNT(*) FILTER (WHERE decision = 'approved')::float /
                NULLIF(COUNT(*), 0) AS local_approval_rate,
            AVG(decision_days) AS avg_decision_time_days,
            COUNT(*) AS similar_applications_nearby
        FROM planning_applications
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
        )
        AND decision_date >= NOW() - INTERVAL '5 years'
    """
    row = await pool.fetchrow(query, lon, lat, radius_m)
    return {
        "local_approval_rate": round(float(row["local_approval_rate"] or 0.0), 4),
        "avg_decision_time_days": round(float(row["avg_decision_time_days"] or 0.0), 1),
        "similar_applications_nearby": row["similar_applications_nearby"] or 0,
    }
