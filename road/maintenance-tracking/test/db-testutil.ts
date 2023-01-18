import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import moment from "moment-timezone";
import * as sinon from "sinon";
import { DbObservationData } from "../lib/dao/maintenance-tracking-dao";
import { Havainto, TyokoneenseurannanKirjaus } from "../lib/model/models";
import { convertToDbObservationData } from "../lib/service/maintenance-tracking";
import { SRID_WGS84 } from "@digitraffic/common/dist/utils/geometry";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn,
        truncate,
        "road",
        "road",
        "localhost:54322/road"
    );
}

export async function truncate(db: DTDatabase) {
    await db.tx(async (t) => {
        return await t.batch([
            t.none(
                `DELETE FROM maintenance_tracking_observation_data WHERE created > '2000-01-01T00:00:00Z'`
            ),
            t.none(
                `DELETE FROM maintenance_tracking WHERE created > '2000-01-01T00:00:00Z'`
            ),
            t.none(
                `DELETE FROM maintenance_tracking_work_machine WHERE id >= 0`
            ),
            t.none(
                `DELETE FROM maintenance_tracking_domain WHERE created > '2000-01-01T00:00:00Z'`
            ),
        ]);
    });
}

export function findAllObservations(
    db: DTDatabase
): Promise<DbObservationData[]> {
    return db.tx((t) => {
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

export function createObservationsDbDatas(
    jsonString: string
): DbObservationData[] {
    // Parse JSON to get sending time
    const trackingJson = JSON.parse(jsonString) as TyokoneenseurannanKirjaus;
    const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
    const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma;
    return trackingJson.havainnot.map((havainto: Havainto) => {
        return convertToDbObservationData(
            havainto,
            sendingTime,
            sendingSystem,
            "https://s3Uri.com"
        );
    });
}

const LAST_POINT = `{
   "TYPE": "Point",
   "coordinates": [100.0, 0.0]
}`;
const LINE_STRING = `{
   "type": "LineString",
   "coordinates": [
     [100.0, 0.0],
     [101.0, 1.0]
   ]
 }`;

const COORDINATE_PRECISION = 0.000001;
const INSERT_SQL = `
            INSERT INTO maintenance_tracking(
                id, sending_system, sending_time,
                last_point,
                line_string,
                work_machine_id, start_time, end_time, direction, finished, domain, contract, message_original_id, previous_tracking_id)
            VALUES (
                       NEXTVAL('seq_maintenance_tracking'), $1, $2,
                       ST_Snaptogrid(ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($3), ${SRID_WGS84})), ${COORDINATE_PRECISION}),
                       ST_Snaptogrid(ST_Simplify(ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($4), ${SRID_WGS84})), 0.00005, true), ${COORDINATE_PRECISION}),
                       $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING ID
`;

export function insertMaintenanceTracking(
    db: DTDatabase,
    workMachineId: number,
    endTime: Date,
    previousTrackingId: number | null = null
): Promise<number> {
    return db.tx((t) => {
        return t
            .one<{ id: number }>(INSERT_SQL, [
                "sending_system",
                endTime, // sending_time
                LAST_POINT,
                LINE_STRING,
                workMachineId,
                new Date(endTime.getTime() - 1000 * 60 * 5), // start_time = end_time - 5 min,
                endTime,
                0, // direction
                false, // finished
                "state-roads", // domain
                null, // contract
                null, // message_original_id
                previousTrackingId, // previous_tracking_id
            ])
            .then((value) => {
                return value.id;
            })
            .catch((error) => {
                console.error("method=upsertMaintenanceTracking failed", error);
                throw error;
            });
    });
}

export function upsertWorkMachine(db: DTDatabase): Promise<number> {
    return db
        .tx((t) => {
            return t.one<{ id: number }>(`
            INSERT INTO maintenance_tracking_work_machine(id, harja_id, harja_urakka_id, type)
            VALUES (NEXTVAL('seq_maintenance_tracking_work_machine'), 1, 1, 'Tiehöylä')
            ON CONFLICT(harja_id, harja_urakka_id) DO
                UPDATE SET type = 'Tiehöylä'
            RETURNING id`);
        })
        .then((value) => value.id);
}

export function upsertDomain(db: DTDatabase, domain: string): Promise<null> {
    return db.tx((t) => {
        return t.none(
            `
            INSERT INTO maintenance_tracking_domain(name, source)
            VALUES ($1, $2)
            ON CONFLICT(name) do NOTHING`,
            [domain, domain]
        );
    });
}

export function findAllTrackingIds(db: DTDatabase): Promise<number[]> {
    return db
        .tx((t) => {
            return t.manyOrNone<{ id: number }>(`
                SELECT  id
                FROM maintenance_tracking
                ORDER BY id
           `);
        })
        .then((result) => result.map((value) => value.id));
}

export function mockSecrets<T>(secret: T) {
    sinon.stub(RdsHolder.prototype, "setCredentials").resolves();
    sinon.stub(SecretHolder.prototype, "get").resolves(secret);
}
