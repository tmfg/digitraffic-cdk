import {EcoCounterApi} from "../../lib/api/eco-counter";
import {updateDataForDomain} from "../../lib/service/update";
import {dbTestBase, insertCounter, insertDomain} from "../db-testutil";
import {findAllData} from "../../lib/db/data";

import * as sinon from 'sinon';
import {ApiData} from "../../lib/model/data";
import {DTDatabase} from "digitraffic-common/postgres/database";

const DOMAIN_NAME = 'TEST_DOMAIN';

describe('update tests', dbTestBase((db: DTDatabase) => {
    const EMPTY_DATA: ApiData[] = [];

    afterEach(() => {
        sinon.restore();
    });

    function mockApiResponse(response: ApiData[]) {
        return sinon.stub(EcoCounterApi.prototype, 'getDataForSite').returns(Promise.resolve(response));
    }

    async function assertDataInDb(expected: number, siteId: number, fn?: Function) {
        const data = await findAllData(db, siteId);
        expect(data).toHaveLength(expected);

        if (fn) {
            fn(data);
        }
    }

    test('updateDataForDomain - no counters', async () => {
        await insertDomain(db, DOMAIN_NAME);
        const counterApiResponse = mockApiResponse(EMPTY_DATA);

        await updateDataForDomain(DOMAIN_NAME, '', '');

        expect(counterApiResponse.callCount).toEqual(0);
    });

    test('updateDataForDomain - one counter no data', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        const counterApiResponse = mockApiResponse(EMPTY_DATA);

        await updateDataForDomain(DOMAIN_NAME, '', '');

        expect(counterApiResponse.callCount).toEqual(1);
    });

    const RESPONSE_DATA: ApiData[] = [
        {
            "date": "2015-09-25T05:00:00+0000",
            "isoDate": new Date("2015-09-25T05:00:00+0200"),
            "counts": 1,
            "status": 1,
        }];

    test('updateDataForDomain - one counter and data', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        const counterApiResponse = mockApiResponse(RESPONSE_DATA);

        await updateDataForDomain(DOMAIN_NAME, '', '');

        await assertDataInDb(1, 1);
        expect(counterApiResponse.callCount).toEqual(1);
    });

    test('updateDataForDomain - one counter and data, last update week ago', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        await db.any('update counting_site_counter set last_data_timestamp=now() - interval \'7 days\'');
        const counterApiResponse = mockApiResponse(RESPONSE_DATA);

        await updateDataForDomain(DOMAIN_NAME, '', '');

        await assertDataInDb(1, 1);
        expect(counterApiResponse.callCount).toEqual(1);
    });

    test('updateDataForDomain - one counter and data - no need to update', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        await db.any('update counting_site_counter set last_data_timestamp=now()');
        const counterApiResponse = mockApiResponse(RESPONSE_DATA);

        await updateDataForDomain(DOMAIN_NAME, '', '');

        // timestamp said the data was just updated, so no new data was added
        assertDataInDb(0, 1);
        expect(counterApiResponse.callCount).toEqual(0);
    });
}));
