import {Stack, Construct, StackProps} from '@aws-cdk/core';
import * as InternalLambdas from './internal-lambdas';
import {Props} from './app-props'

export class StatusStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);
        InternalLambdas.create(appProps, this);
    }
}
