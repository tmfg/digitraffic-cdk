import {
  grantOACRights,
  grantOAIRights,
} from "@digitraffic/common/dist/aws/infra/bucket-policy";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";
import type { LamHistoryProps } from "./app-props.js";
import { InternalLambdas } from "./internal-lambdas.js";

export class LamHistoryStack extends DigitrafficStack {
  private readonly appProps: LamHistoryProps;

  constructor(scope: Construct, id: string, appProps: LamHistoryProps) {
    super(scope, id, appProps);
    this.appProps = appProps;
    // Bucket initialization
    const bucket = this.createBucket();

    // Create lambda
    // 'this' reference must be passed to all child resources to keep them tied to this stack
    new InternalLambdas(this, bucket);
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
    if (this.appProps.cloudfrontDistributionArn) {
      grantOACRights({
        bucket,
        distributionArn: this.appProps.cloudfrontDistributionArn,
      });
    }

    if (this.appProps.cloudfrontCanonicalUser) {
      // eslint-disable-next-line deprecation/deprecation
      grantOAIRights({
        bucket,
        canonicalUserId: this.appProps.cloudfrontCanonicalUser,
      });
    }

    // Upload data
    new BucketDeployment(this, "LamHistoryFiles", {
      destinationBucket: bucket,
      sources: [Source.asset("./src/website")],
    });

    return bucket;
  }
}
