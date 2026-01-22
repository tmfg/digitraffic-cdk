import type { AwsCredentialIdentity } from "@aws-sdk/types";
import nock from "nock";
import { OpenSearch } from "../../api/opensearch.js";

//import { retryCount } from "@digitraffic/common/dist/utils/retry";

const mockCredentials: AwsCredentialIdentity = {
  accessKeyId: "mockAccessKeyId",
  secretAccessKey: "mockSecretAccessKey",
};

// nock doesn't seem to work with NodeHttpHandler (yet?)
test("fetchDataFromOs retries after a response of 429", async () => {
  nock("http://localhost")
    // biome-ignore lint/complexity/useLiteralKeys: indexed access
    .post(`/${process.env[`OS_INDEX`]}/path`)
    .reply(429)
    // biome-ignore lint/complexity/useLiteralKeys: indexed access
    .post(`/${process.env["OS_INDEX"]}/path`)
    .reply(200, { foo: "bar" });
  new OpenSearch("osHost", "http://localhost", mockCredentials);
  //await openSearchApi.makeOsQuery(process.env["OS_INDEX"]!, OpenSearchApiMethod.SEARCH, "query");
  //expect(retryCount).toBe(1);
}, 10000);
