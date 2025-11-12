import { YearlyPlansEnvKeys } from "../../keys.js";
import { fetchData } from "../../service/yearly-plans-service.js";
import { uploadCompressedDataToS3 } from "../../util/s3-util.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

interface RipaSecret extends GenericSecret {
  readonly url: string;
  readonly apiKey: string;
}
const secretHolder = SecretHolder.create<RipaSecret>("ripa");


export const handler = async (): Promise<void> => {
  const start = Date.now();

  const bucketName = process.env[YearlyPlansEnvKeys.S3_BUCKET_NAME];

  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME environment variable is required");
  }

  try {
    const secret = await secretHolder.get();

    const yearlyPlansData = await fetchData(`${secret.url}/supa-api/v1/yearly-plan`, secret.apiKey);
    const yearlyPlansDataString = JSON.stringify(yearlyPlansData, null, 2);
    const yearlyPlansS3Key = await uploadCompressedDataToS3(bucketName, yearlyPlansDataString, "yearly-plans/yearly-plans.json");

    logger.info({
      method: "UpdatePlans.handler",
      message: `Successfully uploaded ${yearlyPlansS3Key}`,
    });

    const projectPlansData = await fetchData(`${secret.url}/supa-api/v1/project-plan`, secret.apiKey);
    const projectPlansDataString = JSON.stringify(projectPlansData, null, 2);
    const projectPlansS3Key = await uploadCompressedDataToS3(bucketName, projectPlansDataString, "project-plans/project-plans.json");

    logger.info({
      method: "UpdatePlans.handler",
      message: `Successfully uploaded ${projectPlansS3Key}`,
    });

  } finally {
    logger.info({
      method: "UpdatePlans.handler",
      tookMs: Date.now() - start,
    });
  }
};
