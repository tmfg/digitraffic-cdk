import { defaultLambdaConfiguration } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import {
  add404Support,
  createDefaultPolicyDocument,
} from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import type { Stack } from "aws-cdk-lib";
import {
  EndpointType,
  LambdaIntegration,
  MethodLoggingLevel,
  type Resource,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AssetCode } from "aws-cdk-lib/aws-lambda";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { VoyagePlanGatewayProps } from "./app-props.js";
import { VoyagePlanEnvKeys } from "./keys.js";

export function create(
  secret: ISecret,
  props: VoyagePlanGatewayProps,
  stack: DigitrafficStack,
): void {
  const api = createRestApi(stack, "VPGW-Public", "VPGW public API");

  const resource = api.root.addResource("temp").addResource("schedules");
  // eslint-disable-next-line deprecation/deprecation
  createUsagePlan(
    api,
    "VPGW Public CloudFront API Key",
    "VPGW Public CloudFront Usage Plan",
  );
  createVtsProxyHandler(stack, resource, secret, props);
}

function createRestApi(stack: Stack, apiId: string, apiName: string): RestApi {
  const restApi = new RestApi(stack, apiId, {
    deployOptions: {
      loggingLevel: MethodLoggingLevel.ERROR,
    },
    restApiName: apiName,
    endpointTypes: [EndpointType.REGIONAL],
    policy: createDefaultPolicyDocument(),
  });
  add404Support(restApi, stack);
  return restApi;
}

function createVtsProxyHandler(
  stack: DigitrafficStack,
  api: Resource,
  secret: ISecret,
  props: VoyagePlanGatewayProps,
): void {
  const env: Record<string, string> = {};
  env[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
  const functionName = "VPGW-Get-Schedules";
  // ATTENTION!
  // This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
  // The reason for this is IP based restriction in another system's firewall.
  const handler = MonitoredFunction.create(
    stack,
    functionName,
    defaultLambdaConfiguration({
      functionName,
      code: new AssetCode("dist/lambda"),
      handler: "lambda-get-schedules.handler",
      environment: env,
      vpc: stack.vpc,
      timeout: 10,
      reservedConcurrentExecutions: 1,
      memorySize: 128,
    }),
  );
  secret.grantRead(handler);
  const integration = new LambdaIntegration(handler, {
    proxy: true,
  });
  api.addMethod("GET", integration, {
    apiKeyRequired: true,
  });
}
