import {Props} from './app-props';
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment';
import * as InternalLambdas from './internal-lambdas';
import {BlockPublicAccess, Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import {CanonicalUserPrincipal, Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Construct} from "constructs";
import {DigitrafficStack} from "@digitraffic/common/dist/aws/infra/stack/stack";

export class SwaggerJoinerStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, swaggerJoinerProps: Props) {
        super(scope, id, swaggerJoinerProps);

        const bucket = this.createBucket();
        InternalLambdas.create(this, bucket);
    }

    private createBucket() {
        const props = this.configuration as Props;

        const bucket = new Bucket(this, 'SwaggerBucket', {
            bucketName: props.bucketName,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            cors: [{
                allowedOrigins: ['*'],
                allowedMethods: [HttpMethods.GET],
            }],
        });

        new BucketDeployment(this, 'SwaggerFiles', {
            destinationBucket: bucket,
            sources: [Source.asset('./resources')],
            destinationKeyPrefix: props.directory,
            exclude: ['dt-swagger.js', 'version.txt'],
        });

        if (props.s3VpcEndpointId) {
            const getObjectStatement = new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:GetObject'],
                conditions: {
                    StringEquals: {
                        'aws:sourceVpce': props.s3VpcEndpointId,
                    },
                },
                resources: [`${bucket.bucketArn}/*`],
            });
            getObjectStatement.addAnyPrincipal();
            bucket.addToResourcePolicy(getObjectStatement);
        }
        if (props.cloudFrontCanonicalUser) {
            bucket.addToResourcePolicy(new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:GetObject'],
                principals: [
                    new CanonicalUserPrincipal(props.cloudFrontCanonicalUser),
                ],
                resources: [`${bucket.bucketArn}/*`],
            }));
        }

        return bucket;
    }
}
