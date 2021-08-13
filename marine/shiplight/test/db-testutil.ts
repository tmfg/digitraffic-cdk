import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {IDatabase} from "pg-promise";
import {ShipTypes} from "../lib/db/areatraffic";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

export async function insertAreaTraffic(db: IDatabase<any, any>, id: number, name: string, duration: number, geometry: string): Promise<any> {
    return await db.tx(async t => {
       await db.none('INSERT INTO areatraffic(id,name,brighten_duration_min,geometry) values ($1, $2, $3, $4)',
           [id, name, duration, geometry]);
    });
}

export async function insertVessel(db: IDatabase<any, any>, mmsi: number, ship_type: ShipTypes): Promise<any> {
    return await db.tx(async t => {
        await db.none('INSERT INTO vessel(mmsi,timestamp,name,ship_type,reference_point_a,reference_point_b,reference_point_c,reference_point_d,pos_type,draught,imo,eta) ' +
            'values ($1, $2, $3, $4, 1,1,1,1,1,1,1,1)',
            [mmsi, Date.now(), 'test', ship_type]);
    });
}


export async function insertVesselLocation(db: IDatabase<any, any>, mmsi: number, timestamp: number, x: number): Promise<any> {
    return await db.tx(async t => {
        await db.none('INSERT INTO vessel_location(mmsi,timestamp_ext,x,y,sog,cog,nav_stat,rot,pos_acc,raim,timestamp) ' +
            'values ($1, $2, $3, 1, 1, 1, 1, 1, true, true, 1)',
            [mmsi, timestamp, x]);
    });
}

export async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await db.none('DELETE FROM areatraffic');
        await db.none('DELETE FROM vessel_location');
        await db.none('DELETE FROM vessel');
    });
}
