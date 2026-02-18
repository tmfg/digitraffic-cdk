import { grantOACRights } from "@digitraffic/common/dist/aws/infra/bucket-policy";
import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { CorsRule } from "aws-cdk-lib/aws-s3";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";

export interface YearlyPlansConfiguration extends StackConfiguration {
  readonly yearlyPlansBucketName: string;
  readonly projectPlansBucketName: string;
  readonly cloudFrontArn: string;
  readonly yearlyPlansBucketCorsRules: CorsRule[];
}

export class YearlyPlansStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    configuration: YearlyPlansConfiguration,
  ) {
    super(scope, id, configuration);

    const yearlyPlansBucket = this.createS3Bucket(
      configuration.yearlyPlansBucketName,
      configuration.yearlyPlansBucketCorsRules,
    );
    const projectPlansBucket = this.createS3Bucket(
      configuration.projectPlansBucketName,
    );

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

  private createS3Bucket(bucketName: string, corsRules?: CorsRule[]): Bucket {
    return new Bucket(this, bucketName, {
      bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      ...(corsRules ? { cors: corsRules } : {}),
    });
  }
}
