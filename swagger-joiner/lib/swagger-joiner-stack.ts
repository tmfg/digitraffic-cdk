import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {Props} from './app-props';
import * as InternalLambdas from './internal-lambdas'
import {Bucket} from "@aws-cdk/aws-s3";

export class SwaggerJoinerStack extends Stack {
    constructor(scope: Construct, id: string, swaggerJoinerProps: Props, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'SwaggerBucket');
        InternalLambdas.create(bucket, swaggerJoinerProps, this);
    }
}