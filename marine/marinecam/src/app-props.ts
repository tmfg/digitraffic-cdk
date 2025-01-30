import type { Duration } from "aws-cdk-lib";
import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type MobileServerProps = StackConfiguration & {
  readonly updateFrequency: Duration;
  readonly enablePasswordProtectedApi: boolean;
  readonly enableKeyProtectedApi: boolean;
};
