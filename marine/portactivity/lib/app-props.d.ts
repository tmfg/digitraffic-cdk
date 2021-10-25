import {Duration} from "@aws-cdk/core"
import {StackConfiguration} from "digitraffic-common/stack/stack";

export interface Props extends StackConfiguration {
    readonly dlqBucketName: string
    readonly dlqNotificationDuration: Duration
    readonly dbClusterIdentifier: string
    readonly documentationBucketName: string
    readonly awakeATx: boolean
}
