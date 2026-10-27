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
    this.createVisitsEndpoint(stack, visitResource);
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

  createVisitEndpoint(stack: DigitrafficStack, visitsResource: Resource): void {
    const visitLambda = FunctionBuilder.create(stack, "get-visit").build();
    const visitModel = addServiceModel(
      "VisitModel",
      this.publicApi,
      z.toJSONSchema(visitResponseSchema, {
        target: "draft-4",
      }) as JsonSchema,
    );
    const getVisitIntegration = new DigitrafficIntegration(
      visitLambda,
      MediaType.APPLICATION_JSON,
    )
      .addPathParameter("visitId")
      .build();

    const visitResource = visitsResource.addResource("{visitId}");

    ["GET", "HEAD"].forEach((httpMethod) => {
      visitResource.addMethod(httpMethod, getVisitIntegration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            visitModel,
            MediaType.APPLICATION_JSON_UTF8,
          ),
          DigitrafficMethodResponse.response400(),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    this.publicApi.documentResource(
      visitResource,
      DocumentationPart.method(
        PORT_CALL_TAG_V2,
        "GetVisit",
        "Return one visit.",
      ),
    );
  }

  createVisitsEndpoint(
    stack: DigitrafficStack,
    visitsResource: Resource,
  ): void {
    const visitsLambda = FunctionBuilder.create(stack, "get-visits")
      .withReservedConcurrentExecutions(8)
      .withMemorySize(256)
      .build();
    const visitModel = addServiceModel(
      "VisitsModel",
      this.publicApi,
      z.toJSONSchema(visitResponseSchema.array(), {
        target: "draft-4",
      }) as JsonSchema,
    );
    const visitsIntegration = new DigitrafficIntegration(
      visitsLambda,
      MediaType.APPLICATION_JSON,
    )
      .passAllQueryParameters()
      .build();

    ["GET", "HEAD"].forEach((httpMethod) => {
      visitsResource.addMethod(httpMethod, visitsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
          "method.request.querystring.fromDateTime": false,
          "method.request.querystring.toDateTime": false,
          "method.request.querystring.portOfCall": false,
          "method.request.querystring.vesselName": false,
          "method.request.querystring.imo": false,
          "method.request.querystring.status": false,
          "method.request.querystring.sort": false,
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
      visitsResource,
      DocumentationPart.method(
        PORT_CALL_TAG_V2,
        "GetVisits",
        "Return all active visits. Visits are sorted by default in ascending order by ATA if available, otherwise by ETA.",
      ),
    );

    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter(
        "fromDateTime",
        "Return visits where any timestamp (ETA, ETD, ATA or ATD) is on or after this value. Inclusive. ISO 8601 datetime.",
      ),
    );
    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter(
        "toDateTime",
        "Return visits where any timestamp (ETA, ETD, ATA or ATD) is before this value. Exclusive. ISO 8601 datetime.",
      ),
    );
    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter("portOfCall", "Filter by port locode."),
    );
    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter(
        "vesselName",
        "Filter by vessel name. Case-insensitive partial match.",
      ),
    );
    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter("imo", "Filter by IMO number."),
    );
    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter(
        "status",
        "Filter by visit status. Values: expected-to-arrive, arrived, departed, cancelled.",
      ),
    );
    this.publicApi.documentResource(
      visitsResource,
      DocumentationPart.queryParameter(
        "sort",
        "Sort results by field:direction. Fields: eta, etd, ata, atd, vesselName, portOfCall, status. Directions: asc, desc. Example: sort=eta:desc",
      ),
    );
  }
}
