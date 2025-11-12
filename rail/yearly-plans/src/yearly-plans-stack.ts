import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";

export interface YearlyPlansConfiguration extends StackConfiguration {
  readonly bucketName: string;
}

export class YearlyPlansStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: YearlyPlansConfiguration) {
    super(scope, id, configuration);

    const bucket = this.createS3Bucket(configuration.bucketName);

    InternalLambdas.create(this, bucket);
  }

  private createS3Bucket(bucketName: string): Bucket {
    return new Bucket(this, "YearlyPlansBucket", {
      bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
  }
}
