import {
  type GetSecretValueCommandInput,
  type GetSecretValueCommandOutput,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import { jest } from "@jest/globals";

const SECRET_ID = "test_secret";
const SECRET_WITH_PREFIX = {
  "prefix.value": "value",
  "prefix.name": "name",
  "wrong.value": "value",
};

const emptySecret: GetSecretValueCommandOutput = { $metadata: {} };

const getSecretValueMock = jest.fn<
  (arg: GetSecretValueCommandInput) => Promise<GetSecretValueCommandOutput>
>();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
jest.spyOn(SecretsManager.prototype, "getSecretValue").mockImplementation(getSecretValueMock);

// eslint-disable-next-line @rushstack/no-new-null
function mockSecret<T>(secret: null | T): void {
  if (!secret) {
    getSecretValueMock.mockImplementation(() => Promise.resolve(emptySecret));
  } else {
    getSecretValueMock.mockImplementation(() =>
      Promise.resolve({
        ...emptySecret,
        ...{ SecretString: JSON.stringify(secret) },
      })
    );
  }
}

// eslint-disable-next-line dot-notation
process.env["AWS_REGION"] = "eu-west-1";

const secret = await import("../../aws/runtime/secrets/secret.js");
const { getSecret } = secret;

describe("secret - test", () => {
  test("getSecret - no secret", async () => {
    mockSecret(null);
    await expect(async () => {
      await getSecret(SECRET_ID, "");
    }).rejects.toThrow("No secret found!");
  });

  test("getSecret - empty secret", async () => {
    mockSecret({});
    const secret = await getSecret(SECRET_ID, "");
    expect(secret).toEqual({});
  });

  test("getSecret - no prefix", async () => {
    mockSecret(SECRET_WITH_PREFIX);
    const secret = await getSecret(SECRET_ID, "");
    expect(secret).toEqual(SECRET_WITH_PREFIX);
  });

  test("getSecret - with prefix", async () => {
    mockSecret(SECRET_WITH_PREFIX);
    const secret = await getSecret(SECRET_ID, "prefix");
    expect(secret).toEqual({
      value: "value",
      name: "name",
    });
  });
});
