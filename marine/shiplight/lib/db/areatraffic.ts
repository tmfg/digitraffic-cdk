import {IDatabase, PreparedStatement} from 'pg-promise';

export type DbAreaTraffic = {
    readonly areaId: number
}

const GET_AREA_TRAFFIC_SQL = `

`.trim();

export function getAreaTraffic(db: IDatabase<any, any>): Promise<DbAreaTraffic[]> {
    const ps = new PreparedStatement({
        name: 'get-area-traffic',
        text: GET_AREA_TRAFFIC_SQL
    });
    return db.manyOrNone(ps);
}
