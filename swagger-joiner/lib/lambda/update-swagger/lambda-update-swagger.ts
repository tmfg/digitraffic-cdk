import {config as AWSConfig} from "aws-sdk";
import axios from 'axios';
import {constructSwagger, mergeApiDescriptions} from "../../swagger-utils";
import {exportSwaggerApi} from "../../apigw-utils";
import {uploadToS3} from "../../s3-utils";

export const KEY_BUCKET_NAME = 'BUCKET_NAME';
export const KEY_REGION = 'REGION';
export const KEY_APP_URL = 'APP_URL';
export const KEY_APIGW_APPS = 'APIGW_APPS';

export const handler = async (): Promise<any> => {
    const bucketName = process.env[KEY_BUCKET_NAME] as string;
    const appUrl = process.env[KEY_APP_URL] as string;
    const apigatewayIds = JSON.parse(process.env[KEY_APIGW_APPS] as string) as string[];

    AWSConfig.update({region: process.env[KEY_REGION] as string});

    const apiResponses = await Promise.all(apigatewayIds.map(exportSwaggerApi));
    const apis = apiResponses.map(resp => JSON.parse(resp.body as string));
    const appApi = (await axios.get(appUrl)).data;
    const allApis = apis.concat([appApi]);

    const merged = mergeApiDescriptions(allApis);

    await uploadToS3(bucketName, constructSwagger(merged), 'dt-swagger.js', 'public-read');
};
