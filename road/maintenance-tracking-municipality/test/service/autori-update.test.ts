import {dbTestBase} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import {AutoriUpdate} from "../../lib/service/autori-update";
import {AutoriApi} from "../../lib/api/autori";
import {
    ApiRouteData,
    DbDomainContract, DbDomainTaskMapping, DbWorkMachine,
} from "../../lib/model/data";
import * as sinon from "sinon";
import {FeatureCollection} from "geojson";
import * as utils from "../../lib/service/utils";
import moment from "moment";

const DOMAIN = 'my-domain';
const VEHICLE_TYPE = 'my-vehicle-type';
const CONTRACT_ID = 'my-contract-1';

const HARJA_BRUSHING = 'BRUSHING';
const HARJA_PAVING = 'PAVING';
const HARJA_SALTING = 'SALTING';

const operation1 = 'task1';
const operation2 = 'task2';
const operation3 = 'task3';



describe('update tests', dbTestBase((db: DTDatabase) => {

    afterEach(() => {
        sinon.restore();
    });

    test('getTasksForOperations', async () => {
        const autoriUpdateService = createAutoriUpdateService();

        const taskMappings = [
            // Map domain operations to harja tasks
            createTaskMapping(DOMAIN, HARJA_BRUSHING, operation1, false),
            createTaskMapping(DOMAIN, HARJA_PAVING, operation2, true),
            createTaskMapping(DOMAIN, HARJA_SALTING, operation3, false),
        ];

        const tasks : string[] = autoriUpdateService.getTasksForOperations([operation1, operation2], taskMappings);

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test('getLatestUpdatedDateForRouteData', async () => {
        const autoriUpdateService = createAutoriUpdateService();
        const past1h = moment().subtract(1, 'hour').toDate();
        const future1h = moment().add(1, 'hour').toDate();
        const route : ApiRouteData[] = [createApiRouteData(past1h), createApiRouteData(future1h)];
        const latest = autoriUpdateService.getLatestUpdatedDateForRouteData(route);
        expect(latest).toEqual(future1h);
    });

    test('createDbWorkMachine', async () => {
        const autoriUpdateService = createAutoriUpdateService();
        const wm : DbWorkMachine = autoriUpdateService.createDbWorkMachine(CONTRACT_ID, VEHICLE_TYPE, DOMAIN);
        expect(wm.harjaUrakkaId).toEqual(utils.createHarjaId(CONTRACT_ID));
        expect(wm.harjaId).toEqual(utils.createHarjaId(VEHICLE_TYPE));
        expect(wm.type).toContain(CONTRACT_ID);
        expect(wm.type).toContain(VEHICLE_TYPE);
        expect(wm.type).toContain(DOMAIN);
    });

    test('todo', async () => {
        const autoriUpdateService = createAutoriUpdateService();
        // createDbMaintenanceTracking(workMachineId: number, routeData: ApiRouteData, contract: DbDomainContract, tasks: string[]): DbMaintenanceTracking[] {
        // route = const route : ApiRouteData[] = [createApiRouteData(past1h), createApiRouteData(future1h)];
        // autoriUpdateService.createDbMaintenanceTracking(1, );
    });

    test('todo', async () => {
        const autoriUpdateService = createAutoriUpdateService();
    });

    // // TODO
    // test('something', async () => {

    //     //autoriUpdateService.createHarjaId
    //     // autoriUpdateService.getTasksForOperations([],[]);
    //     // autoriUpdateService.getLatestUpdatedDateForRouteData([]);
    //     // autoriUpdateService.createDbWorkMachine(contractId, vehicleType, domainName);
    //     autoriUpdateService.updateTrackings(domainName);

    //
    //     autoriUpdateService.updateRoutes( {} as DbDomainContract, [], []);
    //
    //     autoriUpdateService.createDbMaintenanceTracking();
    //     autoriUpdateService.updateContracts(domainName);
    //     autoriUpdateService.updateTasks(domainName);
    //     autoriUpdateService.createDbDomainContracts();
    //     autoriUpdateService.createDbDomainTaskMappings([], domainName);
    //     autoriUpdateService.resolveContractLastUpdateTime();
    // });


    function createAutoriUpdateService() {
        return new AutoriUpdate(AutoriApi.prototype);
    }

    function createTaskMapping(domain : string, harjaTask : string, domainOperation : string, ignore : boolean) : DbDomainTaskMapping {
        return {
            name: harjaTask,
            domain: domain,
            ignore: ignore,
            original_id: domainOperation,
        };
    }

    function createApiRouteData(updated : Date) : ApiRouteData {
        return {
            vehicleType: VEHICLE_TYPE,
            geography: {} as FeatureCollection, // FeatureCollection, // FeatureCollection // optional
            created: new Date(), // optional
            updated: updated, // optional
            id: "a",
            startTime: new Date(),
            endTime: new Date(),
            operations: [operation1, operation2, operation3],
        };
    }

}));

