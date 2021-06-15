import {Duration} from "@aws-cdk/core"

export interface Props {
    readonly vpcId: string
    readonly privateSubnetIds: string[]
    readonly availabilityZones: string[]
    readonly lambdaDbSgId: string
    readonly dlqBucketName: string
    readonly dlqNotificationTopicArn: string
    readonly dlqNotificationDuration: Duration
    readonly dbClusterIdentifier: string
    readonly defaultLambdaDurationSeconds: number
    readonly logsDestinationArn: string
    readonly sqsProcessLambdaConcurrentExecutions: number
    readonly secretId: string
    readonly sources?: {
        readonly teqplay?: boolean,
        readonly pilotweb?: boolean,
    }
    readonly documentationBucketName: string
}
