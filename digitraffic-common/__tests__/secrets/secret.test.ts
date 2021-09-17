import {mockSecret, stubSecretsManager} from "../../test/secrets-manager";

import * as sinon from 'sinon';

const SECRET_ID = "test_secret";
const SECRET_WITH_PREFIX = {
    "prefix.value" : "value",
    "prefix.name" : "name",
    "wrong.value" : "value"
}
const SECRET_EMPTY = {};

stubSecretsManager();

import {getSecret} from "../../secrets/secret";

describe('secret - test', () => {
    afterEach(() => {
        sinon.restore();
    });

    test('getSecret - no secret', async () => {
        mockSecret(null);
        await expect(async () => {
            await getSecret(SECRET_ID, '')
        }).rejects.toThrowError("No secret found!");
    });

    test('getSecret - empty secret', async () => {
        mockSecret(SECRET_EMPTY);
        const secret = await getSecret(SECRET_ID, '');
        expect(secret).toEqual(SECRET_EMPTY);
    });

    test('getSecret - no prefix', async () => {
        mockSecret(SECRET_WITH_PREFIX);
        const secret = await getSecret(SECRET_ID, '');
        expect(secret).toEqual(SECRET_WITH_PREFIX);
    });

    test('getSecret - with prefix', async () => {
        mockSecret(SECRET_WITH_PREFIX);
        const secret = await getSecret(SECRET_ID, 'prefix');
        expect(secret).toEqual({
            value: "value",
            name: "name"
        });
    });
});
