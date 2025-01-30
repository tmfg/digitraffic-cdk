import { LambdaIntegration, type Resource } from "aws-cdk-lib/aws-apigateway";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

export class IntegrationApi {
  readonly restApi: DigitrafficRestApi;
  private updateDatex2Resource!: Resource;
  private updateJsonDataResource!: Resource;
  private updateJsonMetadataResource!: Resource;

  constructor(stack: DigitrafficStack) {
    this.restApi = new DigitrafficRestApi(
      stack,
      "VariableSigns-Integration",
      "Variable Signs integration API",
    );

    this.createResourcePaths();
    this.createDatexV1Handler(stack);
    this.createJsonDataV1Handler(stack);
    this.createJsonMetadataV1Handler(stack);

    this.restApi.createUsagePlan(
      "Integration API key",
      "Integration Usage Plan",
    );
  }

  createResourcePaths(): void {
    const vsResource = this.restApi.root.addResource("variable-signs");
    const v1Resource = vsResource.addResource("v1");

    this.updateDatex2Resource = v1Resource.addResource("update-datex2");
    this.updateJsonDataResource = v1Resource.addResource("update-data");
    this.updateJsonMetadataResource = v1Resource.addResource("update-metadata");
  }

  createDatexV1Handler(stack: DigitrafficStack): void {
    const updateDatexV1Handler = MonitoredDBFunction.create(
      stack,
      "update-datex2",
      undefined,
      {
        memorySize: 256,
      },
    );

    this.updateDatex2Resource.addMethod(
      "PUT",
      new LambdaIntegration(updateDatexV1Handler),
      {
        apiKeyRequired: true,
      },
    );
  }

  createJsonDataV1Handler(stack: DigitrafficStack): void {
    const updateJsonHandler = MonitoredDBFunction.create(
      stack,
      "update-json-data",
    );

    this.updateJsonDataResource.addMethod(
      "PUT",
      new LambdaIntegration(updateJsonHandler),
      {
        apiKeyRequired: true,
      },
    );
  }

  private createJsonMetadataV1Handler(stack: DigitrafficStack): void {
    const updateJsonHandler = MonitoredDBFunction.create(
      stack,
      "update-json-metadata",
    );

    this.updateJsonMetadataResource.addMethod(
      "PUT",
      new LambdaIntegration(updateJsonHandler),
      {
        apiKeyRequired: true,
      },
    );
  }
}
