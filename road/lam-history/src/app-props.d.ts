import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface LamHistoryProps extends StackConfiguration {
  readonly bucketName: string;
  readonly cloudFrontCanonicalUser: string;
  readonly description?: string;
}
