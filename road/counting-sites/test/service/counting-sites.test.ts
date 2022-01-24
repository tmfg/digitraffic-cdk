import {dbTestBase, insertCounter, insertDomain, insertLastUpdated} from "../db-testutil";
import * as CountingSitesService from "../../lib/service/counting-sites";
import {DTDatabase} from "digitraffic-common/database/database";

describe('counting-sites service tests', dbTestBase((db: DTDatabase) => {
    const DOMAIN1 = 'DOMAIN1';
    const DOMAIN2 = 'DOMAIN2';

    test('getDomains - empty', async () => {
        const domains = await CountingSitesService.getDomains();

        expect(domains).toHaveLength(0);
    });

    test('getDomains - two domains', async () => {
        const now = new Date();
        now.setMilliseconds(0);

        await insertDomain(db, DOMAIN1);
        await insertDomain(db, DOMAIN2);
        await insertCounter(db, 1, DOMAIN1, 1);
        await insertLastUpdated(db, 1, now);

        const domains = await CountingSitesService.getDomains();

        expect(domains).toHaveLength(2);
        expect(domains[0].name).toEqual(DOMAIN1);
        expect(domains[1].name).toEqual(DOMAIN2);
    });

    test('getUserTypes', async () => {
        const userTypes = await CountingSitesService.getUserTypes();

        expect(Object.keys(userTypes)).toHaveLength(11);
    });

    test('getCountersForDomain - empty', async () => {
        const counters = await CountingSitesService.getCountersForDomain('empy');

        expect(counters.features).toBeNull();
    });

    test('getDataForCounter - empty', async () => {
        const data = await CountingSitesService.getDataForCounter(0);

        expect(data).toHaveLength(0);
    });

}));
