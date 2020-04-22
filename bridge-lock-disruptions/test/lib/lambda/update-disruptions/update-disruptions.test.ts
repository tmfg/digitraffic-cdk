import * as pgPromise from "pg-promise";
import {handler} from '../../../../lib/lambda/update-disruptions/lambda-update-disruptions';
import {disruptionFeatures} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "../../../../../common/test/httpserver";
import {findAll} from "../../../../lib/db/db-disruptions";

const SERVER_PORT = 8089;
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}/`;

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
            await handler();
            const disruptions = await findAll(db, (d) => d);
            expect(disruptions.length).toBe(features.features.length);
        } finally {
            server.close();
        }
    });

}));
