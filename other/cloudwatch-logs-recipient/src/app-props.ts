import type { FunctionProps } from "aws-cdk-lib/aws-lambda";

export interface Props {
    readonly accounts: Account[];
    readonly elasticSearchEndpoint: string;
    readonly elasticSearchDomainArn: string;
    readonly errorEmail: string;
    readonly lambdaConfig?: FunctionProps;
    readonly warningTopicArn: string;
    readonly alarmTopicArn: string;
}

export interface Account {
    readonly accountNumber: string;
    readonly app: string;
    readonly env: string;
}

export interface AppLogSubscription {
    readonly destinationArn: string;
    readonly logGroupNames: string[];
}
