import { createDocumentationVersion, getDocumentationVersion } from "../../apigw-utils.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { APIGatewayClient, type DocumentationVersion } from "@aws-sdk/client-api-gateway";
import { UPDATE_SWAGGER_KEYS } from "../../model/keys.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export const KEY_APIGW_IDS = "APIGW_IDS" as const;

export const handler = async (): Promise<void> => {
    const apigatewayIds = JSON.parse(getEnvVariable(KEY_APIGW_IDS)) as string[];

    const apigateway = new APIGatewayClient({ region: getEnvVariable(UPDATE_SWAGGER_KEYS.REGION) });

    const apisAndVersions = await Promise.all(
        apigatewayIds.map((apiId) => getDocumentationVersion(apiId, apigateway))
    );

    logger.info({
        method: "UpdateApiDocumentation.handler",
        customVersions: JSON.stringify(apisAndVersions)
    });

    await Promise.all(
        apisAndVersions
            .filter((apisAndVersions) => !!apisAndVersions.versions)
            .map((apiAndVersions) =>
                createDocumentationVersion(
                    apiAndVersions.apiId,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    getLatestVersion(apiAndVersions.versions!),
                    apigateway
                )
            )
    );
};

export function getLatestVersion(versions: DocumentationVersion[]): number {
    const latest = versions.map((v) => Number(v.version)).sort((a, b) => b - a)[0];

    return latest ?? 0; // should never be 0 as length is checked
}
