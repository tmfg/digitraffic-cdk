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
    readonly dbProps: DbProps
    readonly etaProps: {
        readonly clientId: string
        readonly clientSecret: string
        readonly audience: string
        readonly authUrl: string
        readonly endpointUrl: string
        readonly timestampSource: string
    }
}


export interface DbProps {
    readonly username: string;
    readonly password: string;
    readonly uri: string;
    readonly ro_uri: string;
}
