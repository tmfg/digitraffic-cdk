import {updateDataForDomain} from "../../lib/service/update";
import {dbTestBase, insertCounter, insertDomain} from "../db-testutil";
import {IDatabase} from "pg-promise";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import {URL_SITE_DATA} from "../../lib/api/eco-counter";
import {findAllData} from "../../lib/db/data";

const PORT = 8091;

const DOMAIN_NAME = 'TEST_DOMAIN';

describe('update tests', dbTestBase((db: IDatabase<any, any>) => {
    const EMPTY_DATA = JSON.stringify([]);

    async function assertDataInDb(expected: number, siteId: number, fn?: any) {
        const data = await findAllData(db, siteId);
        expect(data).toHaveLength(expected);

        if(fn) {
            fn(data);
        }
    }

    async function withServerSiteData(siteId: number, response: string, fn: ((server: TestHttpServer) => any)) {
        return withServer(URL_SITE_DATA + "/" + siteId, response, fn);
    }

    async function withServer(url: string, response: string, fn: ((server: TestHttpServer) => any)) {
        const server = new TestHttpServer();

        const props: any = {};

        props[url] = () => response;

        server.listen(PORT, props, false);

        try {
            await fn(server);
        } finally {
            server.close();
        }
    }

    test('updateDataForDomain - no counters', async () => {
        await insertDomain(db, DOMAIN_NAME);

        await withServerSiteData(1, EMPTY_DATA, async (server: TestHttpServer) => {
            await updateDataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(0);
        });
    });

    test('updateDataForDomain - one counter no data', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);

        await withServerSiteData(1, EMPTY_DATA, async (server: TestHttpServer) => {
            await updateDataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(1);
        });
    });

    const RESPONSE_DATA = JSON.stringify([
        {
            "date": "2015-09-25T05:00:00+0000",
            "isoDate": "2015-09-25T05:00:00+0200",
            "counts": 1,
            "status": 1
        }]);

    test('updateDataForDomain - one counter and data', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);

        await withServerSiteData(1, RESPONSE_DATA, async (server: TestHttpServer) => {
            await updateDataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(1);
        });

        assertDataInDb(1, 1);
    });

    test('updateDataForDomain - one counter and data - no need to update', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        await db.any('update counting_site_counter set last_data_timestamp=now()');

        await withServerSiteData(1, EMPTY_DATA, async (server: TestHttpServer) => {
            await updateDataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            // timestamp said the data was just updated, so no need to get new data
            expect(server.getCallCount()).toEqual(0);
        });

        // timestamp said the data was just updated, so no new data was added
        assertDataInDb(0, 1);
    });
}));
