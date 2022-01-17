// import {dbTestBase, insertCounter, insertDomain} from "../db-testutil";
import {dbTestBase} from "../db-testutil";
// import * as sinon from 'sinon';
import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {AutoriUpdate, TrackingSaveResult} from "../../lib/service/autori-update";
import {AutoriApi} from "../../lib/api/autori";
import {
    ApiContractData,
    ApiOperationData,
    ApiRouteData,
    DbMaintenanceTracking,
    DbDomainContract, DbDomainTaskMapping,
    DbWorkMachine, DbTextId,
} from "../../lib/model/data";
import * as sinon from "sinon";

// const DOMAIN_NAME = 'TEST_DOMAIN';



describe('update tests', dbTestBase((db: DTDatabase) => {

    afterEach(() => {
        sinon.restore();
    });

    test('createHarjaId', async () => {
        const autoriUpdateService = new AutoriUpdate(AutoriApi.prototype);
        const id : BigInt = autoriUpdateService.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        expect(id).toBe(BigInt('5848355178649553145'));
    });

    // TODO
    test('something', async () => {
        const domainName = 'my-domain';
        const vehicleType = 'my-vehicle-type';
        const contractId = 'my-contract-1';
        const autoriUpdateService = new AutoriUpdate(AutoriApi.prototype);
        autoriUpdateService.updateTrackings(domainName);
        autoriUpdateService.getLatestUpdatedDateForRouteData([]);

        autoriUpdateService.createDbWorkMachine(contractId, vehicleType, domainName);
        autoriUpdateService.updateRoutes( {} as DbDomainContract, [], []);
        // autoriUpdateService.getTasksForOperations([],[]);
        // autoriUpdateService.createDbMaintenanceTracking();
        autoriUpdateService.updateContracts(domainName);
        autoriUpdateService.updateTasks(domainName);
        // autoriUpdateService.createDbDomainContracts();
        autoriUpdateService.createDbDomainTaskMappings([], domainName);
        // autoriUpdateService.resolveContractLastUpdateTime();
    });


}));

