interface Props {
    readonly accounts: Account[]
    readonly elasticSearchEndpoint: string
    readonly elasticSearchDomainArn: string
    readonly errorEmail: string
    readonly lambdaConfig?: any
    readonly warningTopicArn: string
    readonly alarmTopicArn: string
}

interface Account {
    readonly accountNumber: string;
    readonly app: string;
    readonly env: string;
}

interface AppLogSubscription {
    readonly destinationArn: string,
    readonly logGroupNames: string[]
}
