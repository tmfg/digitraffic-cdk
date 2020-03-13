import {APIGateway, config as AWSConfig} from "aws-sdk";
import {compose, head, sortBy, prop, reverse} from "ramda";

export const KEY_APIGW_IDS = 'APIGW_IDS';
export const KEY_REGION = 'REGION';

export const handler = async (): Promise<any> => {
    const apigatewayIds = JSON.parse(process.env[KEY_APIGW_IDS] as string) as string[];

    AWSConfig.update({region: process.env[KEY_REGION] as string});

    const apigw = new APIGateway();
    const apisAndVersions = await Promise.all(apigatewayIds.map((apiId) => getDocumentationVersion(apiId, apigw)));
    // @ts-ignore compiler can't handle this
    const getLatestVersion = compose(prop('version'), head, reverse, sortBy(prop('version')));
    await Promise.all(apisAndVersions
        .filter(apiVersions => apiVersions.result.items != null && apiVersions.result.items.length)
        .map(apiVersions =>
            createDocumentationVersion(
                apiVersions.apiId,
                getLatestVersion(apiVersions.result.items),
                apigw)
        ));
};

function getDocumentationVersion(apiId: string, apigw: APIGateway) {
    return apigw.getDocumentationVersions({
        restApiId: apiId
    }).promise().then((result) => ({
        apiId,
        result
    }));
}

function createDocumentationVersion(apiId: string, latestVersion: number, apigw: APIGateway) {
    return apigw.createDocumentationVersion({
        restApiId: apiId,
        stageName: 'prod',
        documentationVersion: (Number(latestVersion) + 1).toString()
    }).promise();
}
