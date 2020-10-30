export interface Props {
    readonly vpcId: string
    readonly privateSubnetIds: string[]
    readonly availabilityZones: string[]
    readonly lambdaDbSgId: string
    readonly dbProps: DbProps
    readonly defaultLambdaDurationSeconds: number
    readonly logsDestinationArn: string
    readonly sqsProcessLambdaConcurrentExecutions: number
    readonly shiplistSnsTopicArn: string
    readonly estimateUpdatedTopicArn: string
    readonly pinpointApplicationId: string
    readonly pinpointTelephoneNumber: string
    readonly shiplistUrl: string
    readonly allowFromIpAddresses: string[]
}
export interface DbProps {
    readonly username: string
    readonly password: string
    readonly uri: string
    readonly ro_uri: string
}
