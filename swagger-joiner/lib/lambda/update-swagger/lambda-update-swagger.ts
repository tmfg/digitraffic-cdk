import * as AWS from "aws-sdk";
import axios from 'axios';
import * as R from 'ramda';

export const KEY_BUCKET_NAME = 'BUCKET_NAME';
export const KEY_REGION = 'REGION';

export const handler = async (): Promise<any> => {
    const bucketName = process.env[KEY_BUCKET_NAME] as string;
    AWS.config.update({region: process.env[KEY_REGION] as string});

    const apigatewayIds = [];
    const appUrl = '';

    const apiResponses = await Promise.all(apigatewayIds.map(exportApi));
    const apis = apiResponses.map(resp => JSON.parse(resp.body as string));
    const appApi = (await axios.get(appUrl)).data;
    const allApis = apis.concat([appApi]);

    const merged = allApis.reduce((acc, curr) => R.mergeDeepLeft(curr, acc));

    const s3 = new AWS.S3();
    await s3.upload({
        Bucket: bucketName,
        Key: 'dt-swagger.js',
        Body: constructSwagger(merged),
        ACL: 'public-read'
    }).promise();
};

function exportApi(apiId: string) {
    var params = {
        exportType: 'swagger',
        restApiId: apiId,
        stageName: 'prod'
    };
    const apigateway = new AWS.APIGateway();
    return apigateway.getExport(params).promise();
}


function constructSwagger(spec: object) {
    return `
        window.onload = function() {
            const ui = SwaggerUIBundle({
            spec: ${JSON.stringify(spec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
            })
            // End Swagger UI call region
    
            window.ui = ui
        }
        `;
}