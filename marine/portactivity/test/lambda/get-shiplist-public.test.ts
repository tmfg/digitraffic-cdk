import {dbTestBase} from "../db-testutil";
import {handlerFn,ShiplistSecret} from "../../lib/lambda/get-shiplist-public/get-shiplist-public";
import {createSecretFunction} from "digitraffic-common/test/secret";
import {ProxyLambdaRequest, ProxyLambdaResponse} from "digitraffic-common/api/proxytypes";

const secret: ShiplistSecret = {
    auth: 'test',
};
const SECRET_FN = createSecretFunction<ShiplistSecret, ProxyLambdaResponse>(secret);

describe('get-shiplist-public', dbTestBase(() => {

    test('no auth - 401', async () => {
        const response = await handlerFn({queryStringParameters: {}} as ProxyLambdaRequest,
            SECRET_FN) as ProxyLambdaResponse;

        expect(response.statusCode).toBe(401);
    });

    test('invalid auth - 403', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await handlerFn({queryStringParameters: { auth: secret.auth + 'foo'}} as any,
            SECRET_FN) as ProxyLambdaResponse;

        expect(response.statusCode).toBe(403);
    });

    test('no locode - 400', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await handlerFn({queryStringParameters: { auth: secret.auth}} as any,
            SECRET_FN) as ProxyLambdaResponse;

        expect(response.statusCode).toBe(400);
    });

    test('invalid locode - 400', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await handlerFn({queryStringParameters: { auth: secret.auth, locode: 'FOO'}} as any,
            SECRET_FN) as ProxyLambdaResponse;

        expect(response.statusCode).toBe(400);
    });

}));
