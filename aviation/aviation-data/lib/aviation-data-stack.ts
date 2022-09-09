import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {Construct} from "constructs";
import {BlockPublicAccess, Bucket} from "aws-cdk-lib/aws-s3";
import {PolicyStatement, User} from "aws-cdk-lib/aws-iam";
import {AviationDataProps} from "./app-props";

export class AviationDataStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: AviationDataProps) {
        super(scope, id, configuration);

        const bucket = this.createBucket();
        this.configureBucketCredentials(configuration, bucket);
    }

    createBucket(): Bucket {
        const bucket = new Bucket(this, 'aviation-data-bucket', {
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            versioned: false,
        });

        return bucket;
    }

    configureBucketCredentials(configuration: AviationDataProps, bucket: Bucket) {
        configuration.bucketWriterArns.forEach(writerUserArn => {
            const user = User.fromUserArn(this, 'bucket-writer-user', writerUserArn);

            bucket.addToResourcePolicy(new PolicyStatement({
                actions: [
                    "s3:*Object",
                ],
                principals: [user],
                resources: [bucket.bucketArn + '/*'],
            }));

            bucket.addToResourcePolicy(new PolicyStatement({
                actions: [
                    "s3:ListBucket",
                ],
                principals: [user],
                resources: [bucket.bucketArn],
            }));
        });

        configuration.bucketReaderArns.forEach(readerUserArn => {
            const user = User.fromUserArn(this, 'bucket-reader-user', readerUserArn);

            bucket.addToResourcePolicy(new PolicyStatement({
                actions: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                ],
                principals: [user],
                resources: [bucket.bucketArn + '/*'],
            }));

            bucket.addToResourcePolicy(new PolicyStatement({
                actions: [
                    "s3:ListBucket",
                ],
                principals: [user],
                resources: [bucket.bucketArn],
            }));
        });
    }
}