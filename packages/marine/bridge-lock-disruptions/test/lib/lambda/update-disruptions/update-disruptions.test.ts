import * as pgPromise from "pg-promise";
import {handlerFn} from '../../../../lib/lambda/update-disruptions/lambda-update-disruptions';
import {disruptionFeatures} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "../../../../../../common/test/httpserver";
import {findAll} from "../../../../lib/db/db-disruptions";

const SERVER_PORT = 8089;

const testSecret = {
    'waterwaydisturbances.url': `http://localhost:${SERVER_PORT}/`
};
describe('lambda-update-disruptions', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('Update', async () => {
        const features = disruptionFeatures();
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/": () => {
                return JSON.stringify(features);
            }
        });
        try {
            await handlerFn((secretId: string, fn: (secret: any) => Promise<void>) => fn(testSecret));
            const disruptions = await findAll(db);
            expect(disruptions.length).toBe(features.features.length);
        } finally {
            server.close();
        }
    });

}));
