import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {Props} from './app-props';
import * as InternalLambdas from './internal-lambdas'

export class SwaggerJoinerStack extends Stack {
    constructor(scope: Construct, id: string, swaggerJoinerProps: Props, props?: StackProps) {
        super(scope, id, props);

        InternalLambdas.create(swaggerJoinerProps, this);
    }
}