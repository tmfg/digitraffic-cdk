import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { LambdaIntegration, Resource } from "aws-cdk-lib/aws-apigateway";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";

export class IntegrationApi {
  readonly restApi: DigitrafficRestApi;
  private updateDatex2Resource!: Resource;

  constructor(stack: DigitrafficStack) {
    this.restApi = new DigitrafficRestApi(
      stack,
      "Datex2-Integration",
      "Datex2 integration API",
    );

    this.createResourcePaths();
    this.createDatex2V1Handler(stack);

    this.restApi.createUsagePlanV2("Integration API");
  }

  createResourcePaths(): void {
    const vsResource = this.restApi.root.addResource("datex2");
    const v1Resource = vsResource.addResource("v1");

    this.updateDatex2Resource = v1Resource.addResource("update-datex2");
  }

  createDatex2V1Handler(stack: DigitrafficStack): void {
    const updateDatexV1Handler = MonitoredDBFunction.create(
      stack,
      "update-datex2",
      undefined,
      {
        singleLambda: true,
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
}
