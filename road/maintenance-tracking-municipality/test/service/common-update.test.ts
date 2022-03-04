/* eslint-disable camelcase */
import {dbTestBase, getDomain, truncate} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import * as CommonUpdateService from "../../lib/service/common-update";
import {DOMAIN_1} from "../testconstants";

describe('common-update-service-test', dbTestBase((db: DTDatabase) => {

    afterEach(async () => {
        await truncate(db);
    });

    test('upsertDomain', async () => {
        await CommonUpdateService.upsertDomain(DOMAIN_1);
        const domain = await getDomain(db, DOMAIN_1);
        expect(domain.name).toEqual(DOMAIN_1);
        expect(domain.source).toBeNull();
    });
}));