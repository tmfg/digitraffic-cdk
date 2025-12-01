import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { Model } from "aws-cdk-lib/aws-apigateway";

export function create(stack: DigitrafficStack): DigitrafficRestApi {
  const publicApi = new DigitrafficRestApi(
    stack,
    "TEST-public",
    "Test public API",
  );

  const testModel = publicApi.addModel("TestModel", {
    contentType: MediaType.TEXT_PLAIN,
    schema: {},
  });

  createTestGetResources(stack, publicApi, testModel);

  return publicApi;
}

function createTestGetResources(
  stack: DigitrafficStack,
  publicApi: DigitrafficRestApi,
  testModel: Model,
): void {
  const testGetLambda = MonitoredDBFunction.create(
    stack,
    "test-get",
    undefined,
    {
      singleLambda: true,
      memorySize: 256,
      reservedConcurrentExecutions: 6,
    },
  );

  const apiResource = publicApi.root.addResource("api");
  const testApiResource = apiResource.addResource("test");
  const v1Resource = publicApi.addResourceWithCorsOptionsSubTree(
    testApiResource,
    "v1",
  );
  const testResource1 = v1Resource.addResource("test1");
  const testResource2 = v1Resource.addResource("test2");

  const testGetIntegration1 = new DigitrafficIntegration(
    testGetLambda,
    MediaType.TEXT_PLAIN,
  )
    .passAllQueryParameters()
    .addMultiValueQueryParameter("multi")
    .build();

  const testGetIntegration2 = new DigitrafficIntegration(
    testGetLambda,
    MediaType.TEXT_PLAIN,
  )
    .addQueryParameter("q1", "q2")
    .build();

  ["GET", "HEAD"].forEach((httpMethod) => {
    testResource1.addMethod(httpMethod, testGetIntegration1, {
      apiKeyRequired: false,
      requestParameters: {
        "method.request.querystring.fixed_in_hours": false,
      },
      methodResponses: [
        DigitrafficMethodResponse.response200(testModel, MediaType.TEXT_PLAIN),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });
  });

  ["GET", "HEAD"].forEach((httpMethod) => {
    testResource2.addMethod(httpMethod, testGetIntegration2, {
      apiKeyRequired: false,
      requestParameters: {
        "method.request.querystring.fixed_in_hours": false,
      },
      methodResponses: [
        DigitrafficMethodResponse.response200(testModel, MediaType.TEXT_PLAIN),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });
  });
}
