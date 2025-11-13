import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";
import {
  grantOACRights,
} from "@digitraffic/common/dist/aws/infra/bucket-policy";

export interface YearlyPlansConfiguration extends StackConfiguration {
  readonly yearlyPlansBucketName: string;
  readonly projectPlansBucketName: string;
  readonly cloudFrontArn: string;
}

export class YearlyPlansStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: YearlyPlansConfiguration) {
    super(scope, id, configuration);

    const yearlyPlansBucket = this.createS3Bucket(configuration.yearlyPlansBucketName);
    const projectPlansBucket = this.createS3Bucket(configuration.projectPlansBucketName);

    InternalLambdas.create(this, yearlyPlansBucket, projectPlansBucket);

    grantOACRights({
      bucket: yearlyPlansBucket,
      distributionArn: configuration.cloudFrontArn,
    });
    grantOACRights({
      bucket: projectPlansBucket,
      distributionArn: configuration.cloudFrontArn,
    });

  }

  private createS3Bucket(bucketName: string): Bucket {
    return new Bucket(this, bucketName, {
      bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
  }
}
