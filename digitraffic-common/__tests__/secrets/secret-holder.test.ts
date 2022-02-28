import {mockSecret, stubSecretsManager} from "../../test/secrets-manager";

import * as sinon from 'sinon';

const SECRET_WITH_PREFIX = {
    "prefix.value" : "value",
    "prefix.name" : "name",
    "wrong.value" : "value",
    "username": "DB_USER",
};
const SECRET_EMPTY = {};

const stubSM = stubSecretsManager();

import {SecretHolder} from "../../aws/runtime/secrets/secret-holder";
import {DatabaseEnvironmentKeys} from "../../aws/runtime/secrets/dbsecret";

describe('SecretHolder - tests', () => {
    afterEach(() => {
        sinon.restore();
        sinon.reset();
        delete process.env[DatabaseEnvironmentKeys.DB_USER];
    });

    test('get - no secret', async () => {
        mockSecret(null);

        const holder = SecretHolder.create();
        await expect(async () => {
            await holder.get();
        }).rejects.toThrowError("No secret found!");
    });

    test('get - empty secret', async () => {
        mockSecret(SECRET_EMPTY);

        const holder = SecretHolder.create();
        const secret = await holder.get();

        expect(secret).toEqual(SECRET_EMPTY);
    });

    test('get - no prefix', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create();
        const secret = await holder.get();

        expect(secret).toEqual(SECRET_WITH_PREFIX);
    });

    test('get - check keys - not found', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create('', ['not_found']);
        await expect(async () => {
            await holder.get();
        }).rejects.toThrow();
    });

    test('get - check keys - found', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create('', ['prefix.value', 'username']);

        await holder.get();
    });

    test('setDatabaseCredentials - no prefix', async() => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create();
        expect(process.env[DatabaseEnvironmentKeys.DB_USER]).toBeUndefined();

        await holder.setDatabaseCredentials();
        expect(process.env[DatabaseEnvironmentKeys.DB_USER]).toEqual(SECRET_WITH_PREFIX.username);
    });

    test('setDatabaseCredentials - with prefix', async() => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create('prefix');
        expect(process.env[DatabaseEnvironmentKeys.DB_USER]).toBeUndefined();

        await holder.setDatabaseCredentials();
        expect(process.env[DatabaseEnvironmentKeys.DB_USER]).toEqual(SECRET_WITH_PREFIX.username);
    });

    test('getSecret - with prefix', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create('prefix');
        const secret = await holder.get();

        expect(secret).toEqual({
            value: "value",
            name: "name",
        });
    });

    test('get - ttl - do not fetch', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create();

        const callCount = stubSM.callCount;

        const secret = await holder.get();
        expect(stubSM.callCount).toEqual(callCount + 1);

        // gets cached secret
        const secret2 = await holder.get();
        expect(stubSM.callCount).toEqual(callCount + 1);
    });

    test('get - ttl - fetch', async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = new SecretHolder('', '', [], {
            ttl: 1,
        });

        const callCount = stubSM.callCount;

        const secret = await holder.get();
        expect(stubSM.callCount).toEqual(callCount + 1);

        // cache expires, fetches secret again
        const start = Date.now();
        while (Date.now() < start+2000);

        const secret2 = await holder.get();
        expect(stubSM.callCount).toEqual(callCount + 2);
    });
});
