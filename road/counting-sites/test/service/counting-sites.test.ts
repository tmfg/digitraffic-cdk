import {dbTestBase, insertCounter, insertDomain, insertLastUpdated} from "../db-testutil";
import {IDatabase} from "pg-promise";
import * as CountingSitesService from "../../lib/service/counting-sites";

describe('counting-sites service tests', dbTestBase((db: IDatabase<any, any>) => {
    const DOMAIN1 = 'DOMAIN1';
    const DOMAIN2 = 'DOMAIN2';

    test('get domains - empty', async () => {
        const metadata = await CountingSitesService.getMetadata();

        expect(metadata.domains).toHaveLength(0);
        expect(Object.keys(metadata.userTypes)).toHaveLength(11);
        expect(Object.keys(metadata.directions)).toHaveLength(3);
        expect(metadata.lastUpdated).toBeNull();
    });

    test('get domains - two domains', async () => {
        const now = new Date();
        now.setMilliseconds(0);

        await insertDomain(db, DOMAIN1);
        await insertDomain(db, DOMAIN2);
        await insertCounter(db, 1, DOMAIN1, 1);
        await insertLastUpdated(db, 1, now);

        const metadata = await CountingSitesService.getMetadata();

        expect(metadata.domains).toHaveLength(2);
        expect(metadata.domains[0].name).toEqual(DOMAIN1);
        expect(metadata.domains[1].name).toEqual(DOMAIN2);
        expect(metadata.lastUpdated).toEqual(now);
        expect(Object.keys(metadata.userTypes)).toHaveLength(11);
    });
}));
