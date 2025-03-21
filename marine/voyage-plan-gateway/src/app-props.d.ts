import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

declare interface VoyagePlanGatewayProps extends StackConfiguration {
  readonly secretId: string;
}
