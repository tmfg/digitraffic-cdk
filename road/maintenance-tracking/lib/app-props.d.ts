import {StackConfiguration} from "digitraffic-common/stack/stack";

declare interface AppProps extends StackConfiguration {
    readonly sqsDlqBucketName: string
    readonly sqsMessageBucketName: string
}
