import {FunctionProps} from "aws-cdk-lib/aws-lambda";

export type Props = {
    readonly accounts: Account[]
    readonly elasticSearchEndpoint: string
    readonly elasticSearchDomainArn: string
    readonly errorEmail: string
    readonly lambdaConfig?: FunctionProps;
    readonly warningTopicArn: string
    readonly alarmTopicArn: string
}

export type Account = {
    readonly accountNumber: string;
    readonly app: string;
    readonly env: string;
}

export type AppLogSubscription = {
    readonly destinationArn: string,
    readonly logGroupNames: string[]
}
