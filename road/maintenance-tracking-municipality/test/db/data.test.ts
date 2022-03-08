/* eslint-disable camelcase */
import {dbTestBase, getDomain, insertDbDomaindContract, insertDomain, truncate} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import {AutoriUpdate} from "../../lib/service/autori-update";
import {AutoriApi} from "../../lib/api/autori";
import moment from "moment";
import * as DataDb from "../../lib/db/data";
import {DbMaintenanceTracking, DbNumberId, DbWorkMachine} from "../../lib/model/db-data";
import {createDbDomainContract, createDbMaintenanceTracking} from "../testutil";
import {Point, Position} from "geojson";
import {GeoJsonPoint} from "digitraffic-common/utils/geojson-types";
import {CONTRACT_ID, DOMAIN_1, HARJA_BRUSHING, HARJA_PAVING, POINT_START, SOURCE_1, VEHICLE_TYPE} from "../testconstants";

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

    async function initData() {
        await truncate(db);
        await insertDomain(db, DOMAIN_1, SOURCE_1);
        await insertDbDomaindContract(db, contract);
        const workMachine : DbWorkMachine = autoriUpdateService.createDbWorkMachine(CONTRACT_ID, DOMAIN_1, VEHICLE_TYPE);
        workMachineId = await db.tx(tx => {
            return DataDb.upsertWorkMachine(tx, workMachine);
        });
        console.info(`Saved workMachine: ${JSON.stringify(workMachineId)}`);
    }

    test('findLatestTrackingForWorkMachine', async () => {
        await initData();
        const startTime = moment().subtract(5, 'minutes').toDate();
        const endTime = moment(startTime).add(1, 'minutes').toDate();
        const lastPoint: Point = createGeoJSONPoint(POINT_START);

        const tracking: DbMaintenanceTracking  = createDbMaintenanceTracking(
            contract, workMachineId.id, startTime, endTime, TASKS , lastPoint,
        );

        const trackintIds = await db.tx(tx => {
            return DataDb.upsertMaintenanceTrackings(tx, [tracking]);
        });
        console.info(`Saved trackings: ${JSON.stringify(trackintIds)}`);

        const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(db, contract.domain, workMachineId.id);

        expect(latest).toBeTruthy();
        expect(latest?.id).toEqual(trackintIds[0].id);
        console.info(`Latest tracking: ${JSON.stringify(latest)}`);
    });

    test('upsertDomain', async () => {
        await DataDb.upsertDomain(db, contract.domain);

        const domain = await getDomain(db, contract.domain);
        expect(domain.name).toEqual(contract.domain);
        expect(domain.source).toBeNull();
    });

    test('upsertDomain with source', async () => {
        await DataDb.upsertDomain(db, contract.domain, contract.source);

        const domain = await getDomain(db, contract.domain);
        expect(domain.name).toEqual(contract.domain);
        expect(domain.source).toEqual(contract.source);
    });
}));