/* eslint-disable camelcase */
import {dbTestBase, insertDbDomaindContract, insertDomain, insertDomaindContract, truncate} from "../db-testutil";
import {DTDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {AutoriUpdate} from "../../lib/service/autori-update";
import {AutoriApi} from "../../lib/api/autori";
import moment from "moment";
import * as DataDb from "../../lib/db/data";
import {DbMaintenanceTracking, DbNumberId, DbWorkMachine} from "../../lib/model/db-data";
import {
    createDbDomainContract,
    createDbMaintenanceTracking,
    HARJA_BRUSHING,
    HARJA_PAVING,
    HARJA_SALTING,
    POINT_450m_FROM_START,
    POINT_START,
} from "../testutil";
import {Point, Position} from "geojson";
import {GeoJsonPoint} from "digitraffic-common/utils/geometry";

const DOMAIN_1 = 'autori-oulu';
const SOURCE_1 = 'Autori / Oulu';

const VEHICLE_TYPE = 'my-vehicle-type';
const CONTRACT_ID = 'my-contract-1';

const OPERATION_BRUSHNG = 'task1';
const OPERATION_PAVING = 'task2';
const OPERATION_SALTING = 'task3';

const X_MIN = 19.0;
const X_MAX = 32.0;
const Y_MIN = 59.0;
const Y_MAX = 72.0;

const autoriUpdateService = createAutoriUpdateService();

function createAutoriUpdateService() {
    return new AutoriUpdate(AutoriApi.prototype);
}

function createGeoJSONPoint(xy: Position): Point {
    return new GeoJsonPoint(xy);
}

let workMachineId : DbNumberId;
const contract = createDbDomainContract("contract-1", DOMAIN_1);
const TASKS = [HARJA_BRUSHING, HARJA_PAVING];

describe('db-data-test', dbTestBase((db: DTDatabase) => {

    afterEach(async () => {
        await truncate(db);
    });

    beforeEach(async () => {
        await truncate(db);
        await insertDomain(db, DOMAIN_1, SOURCE_1);
        await insertDbDomaindContract(db, contract);
        const workMachine : DbWorkMachine = autoriUpdateService.createDbWorkMachine(CONTRACT_ID, DOMAIN_1, VEHICLE_TYPE);
        workMachineId = await db.tx(tx => {
            return DataDb.upsertWorkMachine(tx, workMachine);
        });
        console.info(`Saved workMachine: ${JSON.stringify(workMachineId)}`);
    });

    test('getLatestFromDb close enough', async () => {

        const startTime = moment().subtract(5, 'minutes').toDate();
        const endTime = moment(startTime).add(1, 'minutes').toDate();
        const nextStartTime = moment(endTime).add(5, 'minutes').toDate();
        const lastPoint: Point = createGeoJSONPoint(POINT_START);

        const tracking: DbMaintenanceTracking  = createDbMaintenanceTracking(
            contract, workMachineId.id, startTime, endTime, TASKS , lastPoint,
        );

        const trackintIds = await db.tx(tx => {
            return DataDb.upsertMaintenanceTrackings(tx, [tracking]);
        });
        console.info(`Saved trackings: ${JSON.stringify(trackintIds)}`);

        const TASKS2 = [HARJA_PAVING, HARJA_BRUSHING];
        const latest = await inDatabaseReadonly(db => {
            return DataDb.findLatestTrackingForWorkMachine(db, contract.domain, workMachineId.id);
        });
        expect(latest).toBeTruthy();
        expect(latest!.id).toEqual(trackintIds[0].id);
        console.info(JSON.stringify(latest));
    });


}));