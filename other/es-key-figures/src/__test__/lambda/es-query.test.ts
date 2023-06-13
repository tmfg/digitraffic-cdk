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

test("fetchDataFromEs retries after a response of 429", async () => {
    //nock()
    //http://localhost/dt-nginx-*/path
    nock("http://localhost")
        .post("/dt-nginx-*/path")
        .reply(429)
        .post("/dt-nginx-*/path")
        .reply(200, { foo: "bar" });
    //AWS.NodeHttpClient.mockIncomingStatusCodeOnce(429).mockIncomingStatusCodeOnce(200);
    await esQuery.fetchDataFromEs(new AWS.Endpoint("http://localhost"), "query", "path");

    //jest.fn().mockImplementationOnce(() => {});

    expect(esQuery.retryCount).toBe(1);
    //expect(esQuery.handleRequest).toHaveBeenCalledTimes(2);
}, 10000);
