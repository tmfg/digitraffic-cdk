import {Duration} from "@aws-cdk/core"
import {StackConfiguration} from "digitraffic-common/stack/stack";

export interface Props extends StackConfiguration {
    readonly dlqBucketName: string
    readonly dlqNotificationTopicArn: string
    readonly dlqNotificationDuration: Duration
    readonly defaultLambdaDurationSeconds: number
    readonly sqsProcessLambdaConcurrentExecutions: number
    readonly dbClusterIdentifier: string

    readonly sources?: {
        readonly pilotweb?: boolean
    }

    readonly documentationBucketName: string
}
