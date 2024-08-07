import { MaintenanceTrackingEnvKeys } from "../keys.js";
import { setEnvVariable } from "@digitraffic/common/dist/utils/utils";

export function setTestEnv(): void {
    setEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME, "sqs-bucket-name");
    setEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL, "https://sqs.aws.123");
    setEnvVariable("AWS_REGION", "aws-region");
    setEnvVariable("SECRET_ID", "");
}
