import {DbSseReport} from "../lib/db/sse-db";
import {dbTestBase as commonDbTestBase} from "../../../common/test/db-testutils";
import {IDatabase} from "pg-promise";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

export async function truncate(db: IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
        return t.batch([
            db.none('DELETE FROM sse_report'),
        ]);
    });
}

export function findAllSseReports(db: IDatabase<any, any>): Promise<DbSseReport[]> {
    return db.tx(t => {
        return t.manyOrNone(`
            SELECT sse_report_id as "sseReportId",
                   created       as "created",
                   latest        as "latest",
                   site_number   as "siteNumber",
                   site_name     as "siteName",
                   last_update   as "lastUpdate",
                   sea_state     as "seaState",
                   trend         as "trend",
                   wind_wave_dir as "windWaveDir",
                   confidence    as "cofidence",
                   heel_angle    as "heelAngle",
                   light_status  as "lightStatus",
                   temperature   as "temperature",
                   longitude     as "longiture",
                   latitude      as "latitude",
                   site_type     as "siteType"
            FROM sse_report
            ORDER BY site_number, sse_report_id
        `);
    });
}

//
// export function createObservationsDbDatas(jsonString : string) : DbObservationData[] {
//     // Parse JSON to get sending time
//     const trackingJson = JSON.parse(jsonString);
//     const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
//     const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma
//     const observationDatas: DbObservationData[] =
//         trackingJson.havainnot.map(( havainto: Havainto ) => {
//             return convertToDbObservationData(havainto, sendingTime, sendingSystem, "https://s3Uri.com");
//         });
//     return observationDatas;
// }