import {Stack, Construct, StackProps, Duration} from '@aws-cdk/core';
import {Props} from './app-props'
import * as InternalLambdas from './internal-lambdas';
import * as HealthCheckProxyApi from './healthcheck-proxy-api';

export class StatusStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        InternalLambdas.create(this, appProps);
        HealthCheckProxyApi.create(this, appProps);
    }
}
