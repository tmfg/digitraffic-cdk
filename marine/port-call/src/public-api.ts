import type { DigitrafficStack } from "@digitraffic/common";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { addServiceModel } from "@digitraffic/common/dist/utils/api-model";
import type { JsonSchema, Resource } from "aws-cdk-lib/aws-apigateway";
import z from "zod";
import { visitResponseSchema } from "./model/visit-schema.js";

const PORT_CALL_TAG_V2 = ["Port Call V2"];

export class PublicApi {
  readonly apiKeyId: string;
  readonly publicApi: DigitrafficRestApi;

  constructor(stack: DigitrafficStack) {
    this.publicApi = new DigitrafficRestApi(
      stack,
      "PC-public",
      "Port Call public API",
    );
    this.apiKeyId = this.publicApi.createUsagePlanV2("Port Call");

    const visitResource = this.createResources(this.publicApi);
    this.createVisitEndpoint(stack, visitResource);

    this.publicApi.exportEndpoint();
  }

  createResources(publicApi: DigitrafficRestApi): Resource {
    const apiResource = publicApi.root.addResource("api");
    const pcResource = apiResource.addResource("port-call");
    const v2Resource = publicApi.addResourceWithCorsOptionsSubTree(
      pcResource,
      "v2",
    );
    const visitsResource = v2Resource.addResource("visits");

    return visitsResource;
  }

  createVisitEndpoint(stack: DigitrafficStack, visitResource: Resource): void {
    const visitsLambda = FunctionBuilder.create(stack, "get-visits").build();
    const visitModel = addServiceModel(
      "VisitModel",
      this.publicApi,
      z.toJSONSchema(visitResponseSchema, {
        target: "draft-4",
      }) as JsonSchema,
    );
    const visitsIntegration = new DigitrafficIntegration(visitsLambda)
      .passAllQueryParameters()
      .build();

    ["GET", "HEAD"].forEach((httpMethod) => {
      visitResource.addMethod(httpMethod, visitsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
          "method.request.querystring.from": false,
          "method.request.querystring.to": false,
        },
        methodResponses: [
          DigitrafficMethodResponse.response200(
            visitModel,
            MediaType.APPLICATION_JSON_UTF8,
          ),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    this.publicApi.documentResource(
      visitResource,
      DocumentationPart.method(
        PORT_CALL_TAG_V2,
        "GetVisits",
        "Return all active visits",
      ),
    );

    this.publicApi.documentResource(
      visitResource,
      DocumentationPart.queryParameter(
        "from",
        "Limit visit timestamp(inclusive)",
      ),
    );
    this.publicApi.documentResource(
      visitResource,
      DocumentationPart.queryParameter(
        "to",
        "Limit visit timestamp(exclusive)",
      ),
    );
    this.publicApi.documentResource(
      visitResource,
      DocumentationPart.queryParameter(
        "sort",
        "Sort results by field:direction. Fields: eta, etd, ata, atd, vesselName, portOfCall, status. Directions: asc, desc. Example: sort=eta:desc",
      ),
    );
  }
}
