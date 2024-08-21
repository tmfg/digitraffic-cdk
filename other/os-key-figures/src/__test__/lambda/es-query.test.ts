import nock from "nock";
import { jest } from "@jest/globals";

function V4(this: any) {
    this.addAuthorization = jest.fn((req, credentials) => {});
}
jest.mock("aws-sdk", () => {
    const originalModule = jest.requireActual("aws-sdk");
    const mockSigner = function Signer() {};
    mockSigner.V4 = V4;
    return {
        __esModule: true,
        originalModule,
        Signers: mockSigner
    };
});

// @ts-ignore
import aws from "aws-sdk";
import { retry } from "@digitraffic/common/dist/utils/retry";
import * as osQuery from "../../lambda/os-query.js";
import type { AwsCredentialIdentity } from "@aws-sdk/types";

const mockCredentials: AwsCredentialIdentity = {
    accessKeyId: "mockAccessKeyId",
    secretAccessKey: "mockSecretAccessKey"
};

test("fetchDataFromOs retries after a response of 429", async () => {
    nock("http://localhost")
        .post("/dt-nginx-*/path")
        .reply(429)
        .post("/dt-nginx-*/path")
        .reply(200, { foo: "bar" });
    await osQuery.fetchDataFromOs("vpcEndpoint", "osHost", "query", "path", mockCredentials);
    //expect(retry.retryCount).toBe(1);
}, 10000);
