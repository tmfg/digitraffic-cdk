import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DTDatabase} from "digitraffic-common/database/database";
import {ShipTypes} from "../lib/db/areatraffic";

// test file
/* eslint-disable camelcase */

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(
        fn, truncate, 'marine', 'marine', 'localhost:54321/marine',
    );
}

export async function assertArea(db: DTDatabase, id: number, duration?: number): Promise<Date> {
    const area = await db.tx(t => {
        return t.oneOrNone('select brighten_sent,brighten_end from areatraffic where id = $1', [id]);
    });

    if (duration) {
        expect(area).toBeDefined();
        expect(area.brighten_sent).toBeDefined();
        expect(area.brighten_end).toBeDefined();

        const sent = new Date(area.brighten_sent);
        const end = new Date(area.brighten_end);

        expect(end.getTime() - sent.getTime()).toEqual(duration * 60 * 1000);
    } else {
        expect(area).toBeNull();
    }

    return area;
}

export async function insertAreaTraffic(
    db: DTDatabase, id: number, name: string, duration: number, geometry: string,
): Promise<void> {
    await db.tx(async t => {
        await t.none('INSERT INTO areatraffic(id,name,brighten_duration_min,geometry) values ($1, $2, $3, $4)',
            [id, name, duration, geometry]);
    });
}

export async function insertVessel(db: DTDatabase, mmsi: number, ship_type: ShipTypes): Promise<void> {
    await db.tx(async t => {
        await t.none('INSERT INTO vessel(mmsi,timestamp,name,ship_type,reference_point_a,reference_point_b,reference_point_c,reference_point_d,pos_type,draught,imo,eta) ' +
            'values ($1, $2, $3, $4, 1,1,1,1,1,1,1,1)',
        [mmsi, Date.now(), 'test', ship_type]);
    });
}


export async function insertVesselLocation(db: DTDatabase, mmsi: number, timestamp: number, x: number): Promise<void> {
    await db.tx(async t => {
        await t.none('INSERT INTO vessel_location(mmsi,timestamp_ext,x,y,sog,cog,nav_stat,rot,pos_acc,raim,timestamp) ' +
            'values ($1, $2, $3, 1, 1, 1, 1, 1, true, true, 1)',
        [mmsi, timestamp, x]);
    });
}

export async function truncate(db: DTDatabase): Promise<void> {
    await db.tx(async t => {
        await t.none('DELETE FROM areatraffic');
        await t.none('DELETE FROM vessel_location');
        await t.none('DELETE FROM vessel');
    });
}
