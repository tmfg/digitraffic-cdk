import { type StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface MaintenanceTrackingStackConfiguration
  extends StackConfiguration {
  readonly sqsDlqBucketName: string;
  readonly sqsMessageBucketName: string;
}
