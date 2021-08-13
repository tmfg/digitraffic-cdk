import {IDatabase} from "pg-promise";
import {handlerFn} from "../../lib/lambda/update-lights/lambda-update-lights";
import {dbTestBase, insertAreaTraffic, insertVessel, insertVesselLocation} from "../db-testutil";
import {createSecretFunction} from "digitraffic-common/test/secret";
import {ShipTypes} from "../../lib/db/areatraffic";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import {updateLightsForArea} from "../../lib/api/arealights";
import {ShiplightSecretKeys} from "../../lib/keys";

const PORT = 8089;
const secret: any = {};
secret[ShiplightSecretKeys.ENDPOINT_URL] = 'http://localhost:' + PORT;
secret[ShiplightSecretKeys.API_KEY] = 'test-api-key';

describe('update-lights', dbTestBase((db: IDatabase<any, any>) => {
    function createHttpServer(statusCode = 200): TestHttpServer {
        const server = new TestHttpServer();
        server.listen(PORT, {
            "/": () => ""
        }, false, statusCode);

        return server;
    }

    test('no areas', async () => {
        const server = createHttpServer();

        try {
            await handlerFn(createSecretFunction(secret), updateLightsForArea);

            expect(server.getCallCount()).toEqual(0);
        } finally {
            server.close();
        }
    });

    test('one area', async () => {
        const duration = 12;
        const areaId = 4;

        await insertAreaTraffic(db, areaId, 'testi1', duration, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, ShipTypes.CARGO); // CARGO will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        const server = createHttpServer();

        try {
            await handlerFn(createSecretFunction(secret), updateLightsForArea);

            expect(server.getCallCount()).toEqual(1);
            const request = JSON.parse(server.getRequest(0));
            expect(request.areaId).toEqual(areaId);
            expect(request.durationInMinutes).toEqual(duration);
        } finally {
            server.close();
        }
    });

    test('error', async () => {
        const duration = 12;
        const areaId = 4;

        await insertAreaTraffic(db, areaId, 'testi1', duration, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, ShipTypes.CARGO); // CARGO will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        const server = createHttpServer(400);

        try {
            await handlerFn(createSecretFunction(secret), updateLightsForArea);
            fail();
        } catch(e) {
            // expected
            expect(server.getCallCount()).toEqual(1);
        } finally {
            server.close();
        }
    });

}));
