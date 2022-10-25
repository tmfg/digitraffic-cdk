import {mockSecret, stubSecretsManager} from "@digitraffic/common/test/secrets-manager";

import * as sinon from 'sinon';

const AUTH = 'test';

const secret = {
    'shiplist.auth': AUTH,
};

stubSecretsManager();
mockSecret(secret);

import {dbTestBase} from "../db-testutil";
import {handler} from "../../lib/lambda/get-shiplist-public/get-shiplist-public";
import {ProxyLambdaRequest, ProxyLambdaResponse} from "@digitraffic/common/aws/types/proxytypes";

describe('get-shiplist-public', dbTestBase(() => {
    afterEach(() => {
        sinon.restore();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function getResponse(request: any): Promise<ProxyLambdaResponse> {
        return await handler(request as ProxyLambdaRequest);
    }

    test('no auth - 401', async () => {
        const response = await getResponse({queryStringParameters: {}});

        expect(response.statusCode).toBe(401);
    });

    test('invalid auth - 403', async () => {
        const response = await getResponse({queryStringParameters: { auth: AUTH + 'foo'}});

        expect(response.statusCode).toBe(403);
    });

    test('no locode - 400', async () => {
        const response = await getResponse({queryStringParameters: { auth: AUTH}});

        expect(response.statusCode).toBe(400);
    });

    test('invalid locode - 400', async () => {
        const response = await getResponse({queryStringParameters: { auth: AUTH, locode: 'FOO'}});

        expect(response.statusCode).toBe(400);
    });

}));
