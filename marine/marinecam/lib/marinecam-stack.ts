import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MobileServerProps } from "./app-props";
import * as InternalLambas from "./internal-lambdas";
import { PrivateApi } from "./private-api";
import { Canaries } from "./canaries";

export class MarinecamStack extends DigitrafficStack {
    constructor(
        scope: Construct,
        id: string,
        configuration: MobileServerProps
    ) {
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
