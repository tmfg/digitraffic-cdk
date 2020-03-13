import {APIGateway} from "aws-sdk";

export function exportSwaggerApi(apiId: string) {
    var params = {
        exportType: 'swagger',
        restApiId: apiId,
        stageName: 'prod'
    };
    const apigateway = new APIGateway();
    return apigateway.getExport(params).promise();
}

export function getDocumentationVersion(apiId: string, apigw: APIGateway) {
    return apigw.getDocumentationVersions({
        restApiId: apiId
    }).promise().then((result) => ({
        apiId,
        result
    }));
}

export function createDocumentationVersion(apiId: string, latestVersion: unknown, apigw: APIGateway) {
    return apigw.createDocumentationVersion({
        restApiId: apiId,
        stageName: 'prod',
        documentationVersion: (Number(latestVersion) + 1).toString()
    }).promise();
}
