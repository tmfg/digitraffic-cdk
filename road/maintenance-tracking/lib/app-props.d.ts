import {StackConfiguration} from "@digitraffic/common/aws/infra/stack/stack";

declare interface AppProps extends StackConfiguration {
    readonly sqsDlqBucketName: string
    readonly sqsMessageBucketName: string
}
