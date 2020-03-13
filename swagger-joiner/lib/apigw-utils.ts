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
