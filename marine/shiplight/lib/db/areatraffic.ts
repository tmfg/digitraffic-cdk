import {IDatabase, PreparedStatement} from 'pg-promise';

export type DbAreaTraffic = {
    readonly id: number
    readonly name: string
    readonly lighting_duration_min: number
}

const GET_AREA_TRAFFIC_SQL = `
    SELECT
        at.id,
        at.name,
        at.lighting_duration_min
    FROM areatraffic at
    JOIN vessel_location vl ON ST_INTERSECTS(at.geometry, ST_MAKEPOINT(vl.x, vl.y))
    WHERE TO_TIMESTAMP(vl.timestamp_ext / 1000) >= (NOW() - INTERVAL '5 MINUTE')
`.trim();

export function getAreaTraffic(db: IDatabase<any, any>): Promise<DbAreaTraffic[]> {
    const ps = new PreparedStatement({
        name: 'get-area-traffic',
        text: GET_AREA_TRAFFIC_SQL
    });
    return db.manyOrNone(ps);
}
