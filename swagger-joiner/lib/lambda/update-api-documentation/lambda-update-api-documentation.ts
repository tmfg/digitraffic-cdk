import {APIGateway, config as AWSConfig} from "aws-sdk";
import {compose, head, sort, prop, map} from "ramda";
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
        .filter(apiVersions => apiVersions.result.items != null && apiVersions.result.items.length)
        .map(apiVersions =>
            createDocumentationVersion(
                apiVersions.apiId,
                getLatestVersion(apiVersions.result.items as ListOfDocumentationVersion),
                apigw)
        ));
};

export function getLatestVersion(versions: ListOfDocumentationVersion) {
    // @ts-ignore compiler can't handle this
    return compose(head, sort((a,b)=>b-a), map(compose(parseInt, prop('version'))))(versions) as number;
}