import asyncpg


async def get_constraints(pool: asyncpg.Pool, lat: float, lon: float) -> dict:
    """
    Query PostGIS layers for planning constraints at a given lat/lon.
    Returns flood zone (1/2/3), conservation area, greenbelt, article4 flags.
    """
    query = """
        SELECT
            COALESCE(
                (SELECT zone_number FROM flood_zones
                 WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
                 ORDER BY zone_number DESC LIMIT 1),
                1
            ) AS flood_zone,

            EXISTS(
                SELECT 1 FROM conservation_areas
                WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
            ) AS in_conservation_area,

            EXISTS(
                SELECT 1 FROM greenbelt_areas
                WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
            ) AS in_greenbelt,

            EXISTS(
                SELECT 1 FROM article4_zones
                WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
            ) AS in_article4_zone
    """
    # PostGIS uses (lon, lat) order in ST_MakePoint
    row = await pool.fetchrow(query, lon, lat)
    return dict(row)
