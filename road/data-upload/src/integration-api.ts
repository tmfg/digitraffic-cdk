import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Resource } from "aws-cdk-lib/aws-apigateway";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import type { Queue } from "aws-cdk-lib/aws-sqs";

export class IntegrationApi {
  readonly restApi: DigitrafficRestApi;
  private uploadDatex2Resource!: Resource;

  constructor(stack: DigitrafficStack, d2Queue: Queue) {
    this.restApi = new DigitrafficRestApi(
      stack,
      "Data-Integration",
      "Data integration API",
    );

    this.createResourcePaths();
    this.createDatex2V1Handler(stack, d2Queue);

    this.restApi.createUsagePlanV2("Integration API");
  }

  createResourcePaths(): void {
    const uploadResource = this.restApi.root.addResource("upload");
    const v1Resource = uploadResource.addResource("v1");

    this.uploadDatex2Resource = v1Resource.addResource("datex2");
  }

  createDatex2V1Handler(stack: DigitrafficStack, d2Queue: Queue): void {
    const uploadDatexV1Handler = FunctionBuilder.create(stack, "upload-datex2")
      .withEnvironment({QUEUE_URL: d2Queue.queueUrl})
      .withMemorySize(256)
      .build();

    this.uploadDatex2Resource.addMethod(
      "PUT",
      new LambdaIntegration(uploadDatexV1Handler),
      {
        apiKeyRequired: true,
      },
    );

    d2Queue.grantSendMessages(uploadDatexV1Handler);
  }
}
