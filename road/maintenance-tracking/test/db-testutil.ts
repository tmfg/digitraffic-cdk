import {DbObservationData} from "../lib/db/maintenance-tracking-db";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {IDatabase} from "pg-promise";
import moment from "moment-timezone";
import {Havainto} from "../lib/lambda/process-queue/lambda-process-queue";
import {convertToDbObservationData} from "../lib/service/maintenance-tracking";


export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
}

export async function truncate(db: IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM maintenance_tracking_observation_data'),
       ]);
    });
}

export function findAllObservations(db: IDatabase<any, any>): Promise<DbObservationData[]> {
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
    const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma
    const observationDatas: DbObservationData[] =
        trackingJson.havainnot.map(( havainto: Havainto ) => {
            return convertToDbObservationData(havainto, sendingTime, sendingSystem, "https://s3Uri.com");
        });
    return observationDatas;
}