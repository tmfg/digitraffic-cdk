import {Duration} from "@aws-cdk/core"

export interface Props {
    readonly vpcId: string
    readonly privateSubnetIds: string[]
    readonly availabilityZones: string[]
    readonly lambdaDbSgId: string
    readonly alarmTopicArn: string
    readonly warningTopicArn: string
    readonly dlqBucketName: string
    readonly dlqNotificationTopicArn: string
    readonly dlqNotificationDuration: Duration
    readonly dbClusterIdentifier: string
    readonly defaultLambdaDurationSeconds: number
    readonly logsDestinationArn: string
    readonly secretId: string
    readonly enableCanaries: boolean
    readonly sources?: {
        readonly pilotweb?: boolean,
    }
    readonly documentationBucketName: string
}
