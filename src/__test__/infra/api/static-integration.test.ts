import { Model } from "aws-cdk-lib/aws-apigateway";
import { describe, expect, test } from "vitest";
import { DigitrafficStaticIntegration } from "../../../aws/infra/api/static-integration.js";
import { MediaType } from "../../../aws/types/mediatypes.js";

describe("response tests", () => {
  test("createIntegrationResponse works", () => {
    const integrationResponse =
      DigitrafficStaticIntegration.createIntegrationResponse(
        "FakeResource",
        MediaType.APPLICATION_JSON,
        { "test-header": "test-value" },
      );
    expect(integrationResponse).toEqual({
      responseParameters: {
        "method.response.header.test-header": "'test-value'",
      },
      responseTemplates: {
        "application/json": "FakeResource",
      },
      statusCode: "200",
    });
  });

  test("createMethodResponse works", () => {
    const methodResponse = DigitrafficStaticIntegration.createMethodResponse(
      {
        "test-header": "test-value",
      },
      MediaType.TEXT_PLAIN,
      Model.EMPTY_MODEL,
    );
    expect(methodResponse).toEqual({
      responseModels: {
        "text/plain": {
          modelId: "Empty",
        },
      },
      responseParameters: {
        "method.response.header.test-header": true,
      },
      statusCode: "200",
    });
  });
});
