import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {Props} from './app-props';
import * as InternalLambdas from './internal-lambdas'
import {Bucket} from "@aws-cdk/aws-s3";
import {Effect, PolicyStatement} from "@aws-cdk/aws-iam";

export class SwaggerJoinerStack extends Stack {
    constructor(scope: Construct, id: string, swaggerJoinerProps: Props, props?: StackProps) {
        super(scope, id, props);

        const bucket = this.createBucket(swaggerJoinerProps);
        InternalLambdas.create(bucket, swaggerJoinerProps, this);
    }

    private createBucket(swaggerJoinerProps: Props) {
        const bucket = new Bucket(this, 'SwaggerBucket', {
            bucketName: swaggerJoinerProps.bucketName
        });

        const getObjectStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:GetObject'],
            conditions: {
                StringEquals: {
                    'aws:sourceVpce': swaggerJoinerProps.s3VpcEndpointId
                }
            },
            resources: [`${bucket.bucketArn}/*`]
        });
        getObjectStatement.addAnyPrincipal();
        bucket.addToResourcePolicy(getObjectStatement);

        const listObjectsStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:ListBucket'],
            conditions: {
                StringEquals: {
                    'aws:sourceVpce': swaggerJoinerProps.s3VpcEndpointId
                }
            },
            resources: [bucket.bucketArn]
        });
        listObjectsStatement.addAnyPrincipal();
        bucket.addToResourcePolicy(listObjectsStatement);

        return bucket;
    }
}
