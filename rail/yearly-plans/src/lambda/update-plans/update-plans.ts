import { YearlyPlansEnvKeys } from "../../keys.js";
import { fetchData } from "../../service/yearly-plans-service.js";
import { uploadCompressedDataToS3 } from "../../util/s3-util.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { Ajv } from "Ajv";
import { schema } from "../../model/schema.js";
import addFormats from "ajv-formats";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

interface YearlyPlansSecret extends GenericSecret {
  readonly url: string;
  readonly apiKey: string;
}
const secretHolder = SecretHolder.create<YearlyPlansSecret>("yp");

const yearlyPlansBucketName = getEnvVariable(
  YearlyPlansEnvKeys.YEARLY_PLANS_BUCKET_NAME,
);
const projectPlansBucketName = getEnvVariable(
  YearlyPlansEnvKeys.PROJECT_PLANS_BUCKET_NAME,
);

// validation with source data schema
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats.default(ajv);
ajv.addSchema(schema, "openapi");
// allow custom format "partial-time" used in the schema
ajv.addFormat("partial-time", /^\d{2}:\d{2}$/);
const validateYearlyPlans = ajv.compile({
  $ref: "openapi#/components/schemas/YearlyPlanListRedactedDto",
});
const validateProjectPlans = ajv.compile({
  $ref: "openapi#/components/schemas/ProjectPlanListRedactedDto",
});

export const handler = async (): Promise<void> => {
  const start = Date.now();

  if (!yearlyPlansBucketName || !projectPlansBucketName) {
    throw new Error(
      "YEARLY_PLANS_BUCKET_NAME and PROJECT_PLANS_BUCKET_NAME environment variables are required",
    );
  }

  try {
    const secret = await secretHolder.get();

    const yearlyPlansData = await fetchData(
      `${secret.url}/yearly-plan`,
      secret.apiKey,
    );

    if (!validateYearlyPlans(yearlyPlansData)) {
      logger.error({
        method: "YearlyPlans.handler",
        message: "Error validating yearly-plans data",
        customErrors: JSON.stringify(validateYearlyPlans.errors),
      });
      throw new Error("Yearly plans validation failed. See logs for details.");
    }

    const yearlyPlansDataString = JSON.stringify(yearlyPlansData, null, 2);
    const yearlyPlansS3Key = await uploadCompressedDataToS3(
      yearlyPlansBucketName,
      yearlyPlansDataString,
      "yearly-plans",
    );

    logger.info({
      method: "UpdatePlans.handler",
      message: `Successfully uploaded ${yearlyPlansS3Key}`,
    });

    const projectPlansData = await fetchData(
      `${secret.url}/project-plan`,
      secret.apiKey,
    );

    if (!validateProjectPlans(projectPlansData)) {
      logger.error({
        method: "YearlyPlans.handler",
        message: "Error validating project-plans data",
        customErrors: JSON.stringify(validateProjectPlans.errors),
      });
      throw new Error("Project plans validation failed. See logs for details.");
    }

    const projectPlansDataString = JSON.stringify(projectPlansData, null, 2);
    const projectPlansS3Key = await uploadCompressedDataToS3(
      projectPlansBucketName,
      projectPlansDataString,
      "project-plans",
    );

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
