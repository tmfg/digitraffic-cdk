import {handlerFn} from '../../../lib/lambda/update-disruptions/update-disruptions';
import {disruptionFeatures} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import * as DisruptionsDb from '../../../lib/db/disruptions';
import {DTDatabase} from "digitraffic-common/database/database";

const SERVER_PORT = 8089;

const testSecret = {
    'waterwaydisturbances.url': `http://localhost:${SERVER_PORT}/`,
};
describe('lambda-update-disruptions', dbTestBase((db: DTDatabase) => {

    test('Update', async () => {
        const features = disruptionFeatures();
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/": () => {
                return JSON.stringify(features);
            },
        });
        try {
            await handlerFn((secretId: string, fn: (secret: unknown) => Promise<void>) => fn(testSecret));
            const disruptions = await DisruptionsDb.findAll(db);
            expect(disruptions.length).toBe(features.features.length);
        } finally {
            server.close();
        }
    });

}));
