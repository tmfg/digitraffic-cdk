import type { DigitrafficStatisticsStack } from "./digitraffic-statistics-stack.js";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import type {
  AwsIntegration,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import type { StatisticsIntegrations } from "./aws-integrations.js";

export class StatisticsApi {
  readonly restApi: RestApi;

  constructor(
    stack: DigitrafficStatisticsStack,
    integrations: StatisticsIntegrations,
  ) {
    this.restApi = this.createRestApi(stack);

    this.createDigitrafficApiStatisticsEndPoint(
      this.restApi,
      integrations.apiStatisticsS3Integration,
    );
    this.createDigitrafficMonthlyEndpoint(
      this.restApi,
      integrations.digitrafficMonthlyLambdaIntegration,
    );
  }

  private createRestApi(stack: DigitrafficStatisticsStack): RestApi {
    return new apigw.RestApi(stack, "digitraffic-statistics-api", {
      restApiName: "digitraffic-statistics-api",
      policy: this.createApiIpRestrictionPolicy(
        stack.statisticsProps.allowedIpAddresses,
      ),
      deployOptions: {
        stageName: "prod",
      },
    });
  }

  private createDigitrafficApiStatisticsEndPoint(
    restApi: RestApi,
    apiStatisticsS3Integration: AwsIntegration,
  ): void {
    restApi.root
      .addResource("digitraffic-api-statistics")
      .addResource("{key}")
      .addMethod("GET", apiStatisticsS3Integration, {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
            },
          },
        ],
        requestParameters: {
          "method.request.path.key": true,
        },
      });
  }

  private createDigitrafficMonthlyEndpoint(
    restApi: RestApi,
    digitrafficMonthlyLambdaIntegration: LambdaIntegration,
  ): void {
    const digitrafficMonthly = restApi.root.addResource("digitraffic-monthly", {
      defaultIntegration: digitrafficMonthlyLambdaIntegration,
    });
    digitrafficMonthly.addProxy({
      defaultIntegration: digitrafficMonthlyLambdaIntegration,
      anyMethod: true,
    });
    digitrafficMonthly.addMethod("GET");
  }

  private createApiIpRestrictionPolicy(
    allowedIpAddresses: string[],
  ): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["execute-api:Invoke"],
          principals: [new iam.AnyPrincipal()],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ["execute-api:Invoke"],
          conditions: {
            NotIpAddress: {
              "aws:SourceIp": allowedIpAddresses,
            },
          },
          principals: [new iam.AnyPrincipal()],
          resources: ["*"],
        }),
      ],
    });
  }
}
