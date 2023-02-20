import { APIGateway } from "aws-sdk";
import { GetExportRequest } from "aws-sdk/clients/apigateway";

export function exportSwaggerApi(apiId: string) {
    const params: GetExportRequest = {
        exportType: "oas30",
        restApiId: apiId,
        stageName: "prod",
    };
    const apigateway = new APIGateway();
    return apigateway.getExport(params).promise();
}

export function getDocumentationVersion(apiId: string, apigw: APIGateway) {
    return apigw
        .getDocumentationVersions({
            restApiId: apiId,
            limit: 500, // XXX maximum value, hope we won't hit this
        })
        .promise()
        .then((result) => ({
            apiId,
            result,
        }));
}

export function createDocumentationVersion(
    apiId: string,
    latestVersion: number,
    apigw: APIGateway
) {
    return apigw
        .createDocumentationVersion({
            restApiId: apiId,
            stageName: "prod",
            documentationVersion: (latestVersion + 1).toString(),
        })
        .promise();
}
