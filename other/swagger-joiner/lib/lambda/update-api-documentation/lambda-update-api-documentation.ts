import {APIGateway, config as AWSConfig} from "aws-sdk";
import * as R from "ramda";
import {createDocumentationVersion, getDocumentationVersion} from "../../apigw-utils";
import {ListOfDocumentationVersion} from "aws-sdk/clients/apigateway";

export const KEY_APIGW_IDS = 'APIGW_IDS';
export const KEY_REGION = 'REGION';

export const handler = async (): Promise<any> => {
    const apigatewayIds = JSON.parse(process.env[KEY_APIGW_IDS] as string) as string[];

    AWSConfig.update({region: process.env[KEY_REGION] as string});

    const apigw = new APIGateway();
    const apisAndVersions = await Promise.all(apigatewayIds.map((apiId) => getDocumentationVersion(apiId, apigw)));
    await Promise.all(apisAndVersions
        .map(apiVersions =>
            createDocumentationVersion(
                apiVersions.apiId,
                getLatestVersion(apiVersions.result.items as ListOfDocumentationVersion),
                apigw)
        ));
};

export function getLatestVersion(versions: ListOfDocumentationVersion): number {
    if (!versions.length) {
        return 0;
    }

    const versionNumbers = versions.map(v => Number(v.version));
    const versionNumbersDesc = R.sort((a: number, b: number) => b-a, versionNumbers);
    return versionNumbersDesc[0];
}
