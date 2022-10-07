import {Duration} from "aws-cdk-lib";
import {StackConfiguration} from "@digitraffic/common/aws/infra/stack/stack";

export type PortactivityConfiguration = StackConfiguration & {
    readonly dlqBucketName: string
    readonly dlqNotificationDuration: Duration
    readonly dbClusterIdentifier: string
    readonly documentationBucketName: string
    readonly awakeATx: boolean
    readonly awakePortApi: boolean
}
