import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
    CanonicalUserPrincipal,
    Effect,
    PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { LamHistoryProps } from "./app-props";
import { InternalLambdas } from "./internal-lambdas";

export class LamHistoryStack extends DigitrafficStack {
    private readonly appProps: LamHistoryProps;

    constructor(scope: Construct, id: string, appProps: LamHistoryProps) {
        super(scope, id, appProps);
        this.appProps = appProps;
        // Bucket initialization
        const bucket = this.createBucket();

        // Create lambda
        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdas(this, bucket, appProps.logsDestinationArn);
    }

    private createBucket(): Bucket {
        // Create bucket
        const bucket = new Bucket(this, "LamHistoryBucket", {
            bucketName: this.appProps.bucketName,
            websiteIndexDocument: "index.html",
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            cors: [
                {
                    allowedOrigins: ["*"],
                    allowedMethods: [HttpMethods.GET],
                },
            ],
        });

        // Allow read from cloudfront
        bucket.addToResourcePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["s3:GetObject"],
                principals: [
                    new CanonicalUserPrincipal(
                        this.appProps.cloudFrontCanonicalUser
                    ),
                ],
                resources: [`${bucket.bucketArn}/*`],
            })
        );

        // Upload data
        new BucketDeployment(this, "LamHistoryFiles", {
            destinationBucket: bucket,
            sources: [Source.asset("./lib/website")],
        });

        return bucket;
    }
}
