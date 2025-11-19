import { App } from "aws-cdk-lib";
import { DigitrafficRestApi } from "../../../aws/infra/stack/rest-api.js";
import type { StackConfiguration } from "../../../aws/infra/stack/stack.js";
import { DigitrafficStack } from "../../../aws/infra/stack/stack.js";

describe("DigitrafficRestApi tests", () => {
  function createRestApi(): DigitrafficRestApi {
    const app = new App();
    const stack = new DigitrafficStack(app, "name", {
      shortName: "TEST",
    } as StackConfiguration);

    return new DigitrafficRestApi(stack, "id", "name");
  }

  test("exportEndpoint - no apikeys", () => {
    expect(() => {
      const restApi = createRestApi();

      restApi.exportEndpoint();
    }).toThrow("No apikeys to export");
  });

  test("exportEndpoint - multiple keys", () => {
    expect(() => {
      const restApi = createRestApi();

      restApi.apiKeyIds.push("key1");
      restApi.apiKeyIds.push("key2");

      restApi.exportEndpoint();
    }).toThrow("Multiple apikeys, configure which to export");
  });

  test("exportEndpoint - multiple keys, set key", () => {
    const restApi = createRestApi();

    restApi.apiKeyIds.push("key1");
    restApi.apiKeyIds.push("key2");

    const [sp1, sp2] = restApi.exportEndpoint({
      apiKeyId: "key3",
    });

    expect(sp1.node.id).toEqual("export.endpoint.TEST");
    expect(sp2.node.id).toEqual("export.apiKeyId.TEST");
  });

  test("exportEndpoint - override name", () => {
    const restApi = createRestApi();

    restApi.apiKeyIds.push("key1");

    const [sp1, sp2] = restApi.exportEndpoint({
      exportName: "exp1",
    });

    expect(sp1.node.id).toEqual("export.endpoint.exp1");
    expect(sp2.node.id).toEqual("export.apiKeyId.exp1");
  });
});
