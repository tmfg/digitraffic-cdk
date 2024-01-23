import { APIGateway } from "aws-sdk";
import {
    DocumentationVersion,
    DocumentationVersions,
    ExportResponse,
    GetExportRequest
} from "aws-sdk/clients/apigateway";

export function exportSwaggerApi(apiId: string): Promise<ExportResponse> {
    const params: GetExportRequest = {
        exportType: "oas30",
        restApiId: apiId,
        stageName: "prod"
    };
    const apigateway = new APIGateway();
    return apigateway.getExport(params).promise();
}

interface DocumentationVersionResult {
    apiId: string;
    result: DocumentationVersions;
}

export function getDocumentationVersion(
    apiId: string,
    apigw: APIGateway
): Promise<DocumentationVersionResult> {
    return apigw
        .getDocumentationVersions({
            restApiId: apiId,
            limit: 500 // XXX maximum value, hope we won't hit this
        })
        .promise()
        .then((result) => ({
            apiId,
            result: result
        }));
}

export function createDocumentationVersion(
    apiId: string,
    latestVersion: number,
    apigw: APIGateway
): Promise<DocumentationVersion> {
    return apigw
        .createDocumentationVersion({
            restApiId: apiId,
            stageName: "prod",
            documentationVersion: (latestVersion + 1).toString()
        })
        .promise();
}
