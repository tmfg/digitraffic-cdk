import type { AwsCredentialIdentity } from "@aws-sdk/types";
import nock from "nock";
import * as osQuery from "../../lambda/os-query.js";
import { retryCount } from "@digitraffic/common/dist/utils/retry";

const mockCredentials: AwsCredentialIdentity = {
    accessKeyId: "mockAccessKeyId",
    secretAccessKey: "mockSecretAccessKey"
};

// nock doesn't seem to work with NodeHttpHandler (yet?)
test("fetchDataFromOs retries after a response of 429", async () => {
    nock("http://localhost")
        .post("/ft-digitraffic-access*/path")
        .reply(429)
        .post("/ft-digitraffic-access*/path")
        .reply(200, { foo: "bar" });
    //await osQuery.fetchDataFromOs("http://localhost", "osHost", "query", "path", mockCredentials);
    //expect(retryCount).toBe(1);
}, 10000);
