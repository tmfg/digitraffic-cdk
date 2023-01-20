import { APIGateway, config as AWSConfig } from "aws-sdk";
import * as R from "ramda";
import {
    createDocumentationVersion,
    getDocumentationVersion,
} from "../../apigw-utils";
import { ListOfDocumentationVersion } from "aws-sdk/clients/apigateway";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

export const KEY_APIGW_IDS = "APIGW_IDS";
export const KEY_REGION = "REGION";

interface ApiAndVersions {
    readonly apiId: string;
    readonly versions: ListOfDocumentationVersion;
}

export const handler = async () => {
    const apigatewayIds = JSON.parse(getEnvVariable(KEY_APIGW_IDS)) as string[];

    AWSConfig.update({ region: getEnvVariable(KEY_REGION) });

    const apigw = new APIGateway();
    const apisAndVersions = await Promise.all(
        apigatewayIds.map((apiId) => getDocumentationVersion(apiId, apigw))
    );
    await Promise.all(
        apisAndVersions
            .map((apiAndVersions) => ({
                apiId: apiAndVersions.apiId,
                versions: apiAndVersions.result.items,
            }))
            .filter(
                (apiAndVersions): apiAndVersions is ApiAndVersions =>
                    !!apiAndVersions.versions
            )
            .map((apiAndVersions) =>
                createDocumentationVersion(
                    apiAndVersions.apiId,
                    getLatestVersion(apiAndVersions.versions),
                    apigw
                )
            )
    );
};

export function getLatestVersion(versions: ListOfDocumentationVersion): number {
    if (!versions.length) {
        return 0;
    }

    const versionNumbers = versions.map((v) => Number(v.version));
    const versionNumbersDesc = R.sort(
        (a: number, b: number) => b - a,
        versionNumbers
    );
    return versionNumbersDesc[0];
}
