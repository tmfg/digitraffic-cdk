export interface Props {
    readonly bucketName: string
    readonly endpointUrl: string
    readonly defaultLambdaDurationSeconds: number
    readonly logsDestinationArn: string
}
