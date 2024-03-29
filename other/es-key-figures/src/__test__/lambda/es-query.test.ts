export {};

const nock = require("nock");
function V4() {
    this.addAuthorization = jest.fn((req, credentials) => {});
}
jest.mock("aws-sdk", () => {
    const originalModule = jest.requireActual("aws-sdk");
    const mockSigner = function Signer() {};
    mockSigner.V4 = V4;
    return {
        __esModule: true,
        ...originalModule,
        Signers: mockSigner
    };
});

// @ts-ignore
const AWS = require("aws-sdk");
const esQuery = require("../../lambda/es-query");
const retry = require("@digitraffic/common/dist/utils/retry");

test("fetchDataFromEs retries after a response of 429", async () => {
    nock("http://localhost")
        .post("/dt-nginx-*/path")
        .reply(429)
        .post("/dt-nginx-*/path")
        .reply(200, { foo: "bar" });
    await esQuery.fetchDataFromEs(new AWS.Endpoint("http://localhost"), "query", "path");
    expect(retry.retryCount).toBe(1);
}, 10000);
