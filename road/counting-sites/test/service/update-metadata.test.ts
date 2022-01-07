import {updateMetadataForDomain} from "../../lib/service/update";
import {dbTestBase, insertCounter, insertDomain, withServer} from "../db-testutil";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import {findAllCountersForUpdateForDomain} from "../../lib/db/counter";
import {URL_ALL_SITES} from "../../lib/api/eco-counter";
import {DTDatabase} from "digitraffic-common/postgres/database";
import {DbCounter} from "../../lib/model/counter";

const PORT = 8091;

const DOMAIN_NAME = 'TEST_DOMAIN';

describe('update tests', dbTestBase((db: DTDatabase) => {
    const EMPTY_DATA = JSON.stringify([]);

    async function assertCountersInDb(domain: string, expected: number, fn?: Function) {
        const counters = await findAllCountersForUpdateForDomain(db, domain);
        expect(counters).toHaveLength(expected);

        if (fn) {
            fn(counters);
        }
    }

    function withServerAllSites(response: string, fn: ((server: TestHttpServer) => void)) {
        return withServer(PORT, URL_ALL_SITES, response, fn);
    }

    test('updateMetadataForDomain - empty', async () => {
        await assertCountersInDb(DOMAIN_NAME, 0);
        await insertDomain(db, DOMAIN_NAME);

        await withServerAllSites(EMPTY_DATA, async (server: TestHttpServer) => {
            await updateMetadataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(1);
        });

        await assertCountersInDb(DOMAIN_NAME, 0);
    });

    const RESPONSE_ONE_COUNTER = JSON.stringify([{
        name: 'DOMAINNAME',
        channels: [
            {
                id: 1,
                domain: "D",
                name: 'COUNTERNAME',
                latitude: 10,
                longitude: 10,
                userType: 1,
                interval: 15,
                sens: 1,
            },
        ],
    }]);

    test('updateMetadataForDomain - insert', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await assertCountersInDb(DOMAIN_NAME, 0);

        await withServerAllSites(RESPONSE_ONE_COUNTER, async (server: TestHttpServer) => {
            await updateMetadataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(1);
        });

        await assertCountersInDb(DOMAIN_NAME, 1, (counters: DbCounter[]) => {
            expect(counters[0].name).toEqual('DOMAINNAME COUNTERNAME');
        });

        await assertCountersInDb('WRONG', 0);
    });

    test('updateMetadataForDomain - update', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        await assertCountersInDb(DOMAIN_NAME, 1);

        await withServerAllSites(RESPONSE_ONE_COUNTER, async (server: TestHttpServer) => {
            await updateMetadataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(1);
        });

        await assertCountersInDb(DOMAIN_NAME, 1);
    });

    test('updateMetadataForDomain - remove', async () => {
        await insertDomain(db, DOMAIN_NAME);
        await insertCounter(db, 1, DOMAIN_NAME, 1);
        await assertCountersInDb(DOMAIN_NAME, 1);

        await withServerAllSites(EMPTY_DATA, async (server: TestHttpServer) => {
            await updateMetadataForDomain(DOMAIN_NAME, '', `http://localhost:${PORT}`);

            expect(server.getCallCount()).toEqual(1);
        });

        await assertCountersInDb(DOMAIN_NAME, 1, (counters: DbCounter[]) => {
            expect(counters[0].removed_timestamp).not.toBeNull();
        });
    });
}));
