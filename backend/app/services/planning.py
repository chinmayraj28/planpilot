import asyncio
import asyncpg


async def get_planning_metrics(pool: asyncpg.Pool, lat: float, lon: float, radius_m: int = 500) -> dict:
    """
    Compute local planning metrics and recent application history from
    historical IBex application data within a given radius (default 500m).
    """
    metrics_query = """
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
    recent_query = """
        SELECT
            COALESCE(reference, 'N/A') AS reference,
            COALESCE(postcode, 'Unknown') AS postcode,
            COALESCE(decision, 'unknown') AS decision,
            TO_CHAR(decision_date, 'YYYY-MM-DD') AS decision_date,
            COALESCE(application_type, 'Unknown') AS application_type
        FROM planning_applications
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            200
        )
        AND decision_date IS NOT NULL
        ORDER BY decision_date DESC
        LIMIT 5
    """
    metrics_row, recent_rows = await asyncio.gather(
        pool.fetchrow(metrics_query, lon, lat, radius_m),
        pool.fetch(recent_query, lon, lat),
    )
    return {
        "local_approval_rate": round(float(metrics_row["local_approval_rate"] or 0.0), 4),
        "avg_decision_time_days": round(float(metrics_row["avg_decision_time_days"] or 0.0), 1),
        "similar_applications_nearby": metrics_row["similar_applications_nearby"] or 0,
        "recent_applications": [
            {
                "reference": r["reference"],
                "postcode": r["postcode"],
                "decision": r["decision"],
                "decision_date": r["decision_date"],
                "application_type": r["application_type"],
            }
            for r in recent_rows
        ],
    }
