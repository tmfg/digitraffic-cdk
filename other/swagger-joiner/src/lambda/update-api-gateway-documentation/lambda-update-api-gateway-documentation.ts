import type { DocumentationVersion } from "@aws-sdk/client-api-gateway";
import { APIGatewayClient } from "@aws-sdk/client-api-gateway";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import {
  createDocumentationVersion,
  getDocumentationVersion,
} from "../../apigw-utils.js";
import { UPDATE_SWAGGER_KEYS } from "../../model/keys.js";

export const KEY_APIGW_IDS = "APIGW_IDS" as const;

export const handler = async (): Promise<void> => {
  const apigatewayIds = JSON.parse(getEnvVariable(KEY_APIGW_IDS)) as string[];

  const apigateway = new APIGatewayClient({
    region: getEnvVariable(UPDATE_SWAGGER_KEYS.REGION),
  });

  const apisAndVersions = await Promise.all(
    apigatewayIds.map((apiId) => getDocumentationVersion(apiId, apigateway)),
  );

  logger.info({
    method: "UpdateApiGatewayDocumentation.handler",
    customVersions: JSON.stringify(apisAndVersions),
  });

  await Promise.all(
    apisAndVersions
      .filter((apisAndVersions) => !!apisAndVersions.versions)
      .map((apiAndVersions) => {
        // biome-ignore lint/style/noNonNullAssertion: checked just above
        const nextVersion = getNextVersion(apiAndVersions.versions!);
        logger.info({
          method: "UpdateApiGatewayDocumentation.handler",
          message: `Creating documentation version ${nextVersion} for ${apiAndVersions.apiId}`,
        });
        return createDocumentationVersion(
          apiAndVersions.apiId,
          nextVersion,
          apigateway,
        );
      }),
  );
};

/**
 * Determines the next documentation version string to create.
 *
 * API Gateway documentation versions are arbitrary strings. In this project two formats exist:
 * - Numeric (e.g. "1", "2", "3"): created by this lambda, incremented on each run.
 * - Hash-based (e.g. "a3f8b2c1"): created at CDK deploy time by some stacks (e.g. AFIR)
 *   as a content hash of the documentation parts, so that deploys are skipped when
 *   documentation hasn't changed.
 *
 * This function handles both: it increments from the highest numeric version and
 * ignores any hash-based versions. If only hash-based versions exist, it falls back
 * to a timestamp to guarantee a unique value that won't collide with existing hashes.
 */
export function getNextVersion(versions: DocumentationVersion[]): string {
  if (versions.length === 0) {
    return "1";
  }

  const versionStrings = versions.map((v) => v.version ?? "");
  const allNumeric = versionStrings.every((v) => /^\d+$/.test(v));

  if (allNumeric) {
    const max = Math.max(...versionStrings.map(Number));
    return (max + 1).toString();
  }

  // Non-numeric or mixed versions: use timestamp as a unique numeric version
  return Date.now().toString();
}
