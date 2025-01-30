import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface Open311Props extends StackConfiguration {
  readonly vpcId: string;
  readonly lambdaDbSgId: string;
  readonly availabilityZones: string[];
  readonly allowFromIpAddresses: string[];
  readonly publicApiKey?: string;
  readonly integrationApiKey?: string;
}
