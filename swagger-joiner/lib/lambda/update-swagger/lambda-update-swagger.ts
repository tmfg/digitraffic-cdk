import * as AWS from "aws-sdk";
import axios from 'axios';
import * as R from 'ramda';
import {PutObjectRequest} from "aws-sdk/clients/s3";

export const KEY_BUCKET_NAME = 'BUCKET_NAME';
export const KEY_REGION = 'REGION';
export const KEY_APP_URL = 'APP_URL';
export const KEY_APIGW_APPS = 'APIGW_APPS';

export const S3_UPLOAD_SETTINGS = {
    Key: 'dt-swagger.js',
    ACL: 'public-read'
};

export const handler = async (): Promise<any> => {
    const bucketName = process.env[KEY_BUCKET_NAME] as string;
    const appUrl = process.env[KEY_APP_URL] as string;
    const apigatewayIds = JSON.parse(process.env[KEY_APIGW_APPS] as string) as string[];

    AWS.config.update({region: process.env[KEY_REGION] as string});

    const apiResponses = await Promise.all(apigatewayIds.map(exportApi));
    const apis = apiResponses.map(resp => JSON.parse(resp.body as string));
    const appApi = (await axios.get(appUrl)).data;
    const allApis = apis.concat([appApi]);

    const merged = allApis.reduce((acc, curr) => R.mergeDeepLeft(curr, acc));

    const s3 = new AWS.S3();

    await s3.upload(Object.assign({}, S3_UPLOAD_SETTINGS, {
        Bucket: bucketName,
        Key: 'dt-swagger.js',
        Body: constructSwagger(merged),
        ACL: 'public-read'
    } as PutObjectRequest)).promise();
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


export function constructSwagger(spec: object) {
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
