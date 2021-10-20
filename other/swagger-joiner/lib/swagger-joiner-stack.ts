import {Construct, StackProps} from '@aws-cdk/core';
import {Props} from './app-props';
import * as InternalLambdas from './internal-lambdas'
import {BlockPublicAccess, Bucket, HttpMethods} from "@aws-cdk/aws-s3";
import {CanonicalUserPrincipal, Effect, PolicyStatement} from "@aws-cdk/aws-iam";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class SwaggerJoinerStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, swaggerJoinerProps: Props) {
        super(scope, id, swaggerJoinerProps);

        const bucket = this.createBucket(swaggerJoinerProps);
        InternalLambdas.create(bucket, swaggerJoinerProps, this);
    }

    private createBucket(swaggerJoinerProps: Props) {
        const bucket = new Bucket(this, 'SwaggerBucket', {
            bucketName: swaggerJoinerProps.bucketName,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            cors: [{
                allowedOrigins: ['*'],
                allowedMethods: [HttpMethods.GET]
            }]
        });

        if (swaggerJoinerProps.s3VpcEndpointId) {
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
        }
        if (swaggerJoinerProps.cloudFrontCanonicalUser) {
            bucket.addToResourcePolicy(new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:GetObject'],
                principals: [
                    new CanonicalUserPrincipal(swaggerJoinerProps.cloudFrontCanonicalUser)
                ],
                resources: [`${bucket.bucketArn}/*`]
            }));
        }

        return bucket;
    }
}
