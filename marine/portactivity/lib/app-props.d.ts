import { Duration } from "aws-cdk-lib";
import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type PortactivityConfiguration = StackConfiguration & {
    // these are required
    readonly secretId: string;
    readonly vpcId: string;
    readonly lambdaDbSgId: string;

    readonly dlqBucketName: string;
    readonly dlqNotificationDuration: Duration;
    readonly dbClusterIdentifier: string;
    readonly documentationBucketName: string;
    readonly awakeATx: boolean;
    readonly awakePortApi: boolean;
};
