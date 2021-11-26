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

import {GenericSecret, withSecret, withSecretAndPrefix} from "../../secrets/secret";

describe('secret - test', () => {
    afterEach(() => {
        sinon.restore();
    });

    test('getSecret - no secret', async () => {
        mockSecret(null);

        await expect(async () => {
            await withSecret(SECRET_ID, () => {
                return Promise.resolve();
            });
        }).rejects.toThrowError("No secret found!");
    });

    test('getSecret - empty secret', async () => {
        mockSecret(SECRET_EMPTY);

        await withSecret(SECRET_ID,  (secret: GenericSecret) => {
            expect(secret).toEqual(SECRET_EMPTY);
            return Promise.resolve();
        });
    });

    test('getSecret - no prefix', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        await withSecret(SECRET_ID,  (secret: GenericSecret) => {
            expect(secret).toEqual(SECRET_WITH_PREFIX);
            return Promise.resolve();
        });
    });

    test('getSecret - with prefix', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        await withSecretAndPrefix(SECRET_ID, 'prefix',  (secret: GenericSecret) => {
            expect(secret).toEqual({
                value: "value",
                name: "name"
            });
            return Promise.resolve();
        });
           
    });
});
