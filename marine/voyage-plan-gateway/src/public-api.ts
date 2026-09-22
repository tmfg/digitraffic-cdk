import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import {
  add404Support,
  createDefaultPolicyDocument,
} from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import type { Stack } from "aws-cdk-lib";
import type { Resource } from "aws-cdk-lib/aws-apigateway";
import {
  EndpointType,
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
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

  createDefaultUsagePlan(api, "VPGW Public CloudFront");
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
  // ATTENTION!
  // This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
  // The reason for this is IP based restriction in another system's firewall.
  // createV2 derives the asset code path and handler from the "get-schedules"
  // name (matching src/lambda/get-schedules/get-schedules.ts) and wires up
  // the stack's VPC automatically, so it stays correct if the esbuild output
  // layout changes again.
  const handler = MonitoredFunction.createV2(stack, "get-schedules", env, {
    functionName: "VPGW-Get-Schedules",
    timeout: 10,
    reservedConcurrentExecutions: 1,
    memorySize: 128,
  });
  secret.grantRead(handler);
  const integration = new LambdaIntegration(handler, {
    proxy: true,
  });
  api.addMethod("GET", integration, {
    apiKeyRequired: true,
  });
}
