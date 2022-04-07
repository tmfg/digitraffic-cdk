import {DTDatabase} from "digitraffic-common/database/database";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import moment from "moment-timezone";
import {DbObservationData} from "../lib/dao/maintenance-tracking-dao";
import {Havainto} from "../lib/model/models";
import {convertToDbObservationData} from "../lib/service/maintenance-tracking";


export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'road', 'road', 'localhost:54322/road',
    );
}

export async function truncate(db: DTDatabase) {
    await db.tx(t => {
        return t.batch([
            db.none(`DELETE FROM maintenance_tracking_observation_data WHERE created > '2000-01-01T00:00:00Z'`),
        ]);
    });
}

export function findAllObservations(db: DTDatabase): Promise<DbObservationData[]> {
    return db.tx(t => {
        return t.manyOrNone(`
            SELECT  id,
                    observation_time as "observationTime",
                    sending_time as "sendingTime",
                    sending_system as "sendingSystem",
                    json,
                    harja_workmachine_id as "harjaWorkmachineId",
                    harja_contract_id as "harjaContractId",
                    status,
                    hash,
                    s3_uri as "s3Uri"
            FROM maintenance_tracking_observation_data
            ORDER BY observation_time
       `);
    });
}

export function createObservationsDbDatas(jsonString : string) : DbObservationData[] {
    // Parse JSON to get sending time
    const trackingJson = JSON.parse(jsonString);
    const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
    const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma;
    return trackingJson.havainnot.map(( havainto: Havainto ) => {
        return convertToDbObservationData(havainto, sendingTime, sendingSystem, "https://s3Uri.com");
    });
}