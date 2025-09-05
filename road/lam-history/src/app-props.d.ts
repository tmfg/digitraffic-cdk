import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface LamHistoryProps extends StackConfiguration {
  readonly bucketName: string;
  readonly cloudfrontCanonicalUser?: string;
  readonly cloudfrontDistributionArn?: string;
  readonly description?: string;
}
