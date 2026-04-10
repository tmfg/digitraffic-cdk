import { afterEach } from "node:test";
import type {
  GetSecretValueCommandInput,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { describe, expect, test, vi } from "vitest";
import { setEnvVariableAwsRegion } from "../../utils/utils.js";

const SECRET_ID = "test_secret";
const SECRET_WITH_PREFIX = {
  "prefix.value": "value",
  "prefix.name": "name",
  "wrong.value": "value",
};

const emptySecret: GetSecretValueCommandOutput = { $metadata: {} };

const getSecretValueMock =
  vi.fn<
    (arg: GetSecretValueCommandInput) => Promise<GetSecretValueCommandOutput>
  >();

vi.spyOn(SecretsManager.prototype, "getSecretValue").mockImplementation(
  getSecretValueMock,
);

function mockSecret<T>(secret: null | T): void {
  if (!secret) {
    getSecretValueMock.mockImplementation(() => Promise.resolve(emptySecret));
  } else {
    getSecretValueMock.mockImplementation(() =>
      Promise.resolve({
        ...emptySecret,
        ...{ SecretString: JSON.stringify(secret) },
      }),
    );
  }
}

setEnvVariableAwsRegion("eu-west-1");

const secret = await import("../../aws/runtime/secrets/secret.js");
const { getSecret } = secret;

describe("secret - test", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
