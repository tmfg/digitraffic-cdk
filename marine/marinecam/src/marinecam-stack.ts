import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import type { MobileServerProps } from "./app-props.js";
import { Canaries } from "./canaries.js";
import * as InternalLambas from "./internal-lambdas.js";
import { PrivateApi } from "./private-api.js";

export class MarinecamStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: MobileServerProps) {
    super(scope, id, configuration);

    const bucket = createImageBucket(this, configuration);

    InternalLambas.create(this, bucket);
    const privateApi = new PrivateApi(this, bucket);

    new Canaries(this, privateApi.restApi);
  }
}

function createImageBucket(stack: Construct, props: MobileServerProps): Bucket {
  return new Bucket(stack, "MarinecamBucket", {
    bucketName: `dt-marinecam-${props.production ? "prod" : "test"}`,
    versioned: false,
    publicReadAccess: false,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  });
}
