import { SecretsManager, type GetSecretValueCommandOutput, type GetSecretValueCommandInput } from "@aws-sdk/client-secrets-manager";
import { jest } from "@jest/globals";

const SECRET_WITH_PREFIX = {
    "prefix.value": "value",
    "prefix.name": "name",
    "wrong.value": "value",
    username: "DB_USER",
};

const emptySecret: GetSecretValueCommandOutput = { $metadata: {} };

const getSecretValueMock = jest.fn<(arg: GetSecretValueCommandInput) => Promise<GetSecretValueCommandOutput>>();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
jest.spyOn(SecretsManager.prototype, "getSecretValue").mockImplementation(getSecretValueMock);

const { SecretHolder } = await import("../../aws/runtime/secrets/secret-holder.mjs");
const { DatabaseEnvironmentKeys } = await import("../../database/database.mjs");

function mockSecret<T>(secret: null | T) {
    if(!secret) {
        getSecretValueMock.mockImplementation(() => Promise.resolve(emptySecret));
    } else {
        getSecretValueMock.mockImplementation(() => Promise.resolve({...emptySecret, ...{SecretString: JSON.stringify(secret)}}));

    }
}

describe("SecretHolder - tests", () => {
    beforeEach(() => {
        process.env["SECRET_ID"] = "test-id";
        process.env["AWS_REGION"] = "eu-west-1";
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env[DatabaseEnvironmentKeys.DB_USER];
    });

    test("get - no secret", () => {
        mockSecret(null);

        const holder = SecretHolder.create();
        const secret = holder.get();
        return expect(secret).rejects.toThrow("No secret found!");
    }, 10000);

    test("get - empty secret", () => {
        mockSecret({});

        const holder = SecretHolder.create();
        const secret = holder.get();

        return expect(secret).resolves.toEqual({});
    });

    test("get - no prefix", () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create();
        const secret = holder.get();

        return expect(secret).resolves.toEqual(SECRET_WITH_PREFIX);
    });

    test("get - check keys - not found", () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create("", ["not_found"]);
        const secret = holder.get();

        return expect(secret).rejects.toThrow();
    });

    test("get - check keys - found", () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create("", ["prefix.value", "username"]);

        return expect(holder.get()).resolves.toBeDefined();
    });

    test("getSecret - with prefix", () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create("prefix");
        const secret = holder.get();

        return expect(secret).resolves.toEqual({
            value: "value",
            name: "name",
        });
    });

    test("get - ttl - do not fetch", async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = SecretHolder.create();

        const callCount = getSecretValueMock.mock.calls.length;

        await holder.get();
        expect(getSecretValueMock).toHaveBeenCalledTimes(callCount + 1);

        // gets cached secret
        await holder.get();
        expect(getSecretValueMock).toHaveBeenCalledTimes(callCount + 1);
    });

    test("get - ttl - fetch", async () => {
        mockSecret(SECRET_WITH_PREFIX);

        const holder = new SecretHolder("", "", [], {
            ttl: 1,
        });

        const callCount = getSecretValueMock.mock.calls.length;

        await holder.get();
        expect(getSecretValueMock).toHaveBeenCalledTimes(callCount + 1);

        // cache expires, fetches secret again
        const start = Date.now();
        while (Date.now() < start + 2000);

        await holder.get();
        expect(getSecretValueMock).toHaveBeenCalledTimes(callCount + 2);
    });
});
