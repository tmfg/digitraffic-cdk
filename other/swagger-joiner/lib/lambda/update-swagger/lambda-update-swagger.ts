import {config as AWSConfig} from "aws-sdk";
import {default as axios, AxiosRequestConfig} from 'axios';
import {constructSwagger, mergeApiDescriptions} from "../../swagger-utils";
import {exportSwaggerApi} from "../../apigw-utils";
import {uploadToS3} from 'digitraffic-common/stack/s3-utils';

export const KEY_BUCKET_NAME = 'BUCKET_NAME';
export const KEY_REGION = 'REGION';
export const KEY_APP_URL = 'APP_URL';
export const KEY_APP_BETA_URL = 'APP_BETA_URL';
export const KEY_APIGW_APPS = 'APIGW_APPS';
export const KEY_DIRECTORY = 'DIRECTORY';
export const KEY_HOST = 'HOST';
export const KEY_TITLE = 'TITLE';
export const KEY_DESCRIPTION = 'DESCRIPTION';
export const KEY_REMOVESECURITY = 'REMOVESECURITY';

const apiRequestHeaders: AxiosRequestConfig = {
  headers: {
      'Accept-Encoding': 'gzip'
  }
};

export const handler = async (): Promise<any> => {
    const bucketName = process.env[KEY_BUCKET_NAME] as string;
    const appUrl = process.env[KEY_APP_URL] as string | undefined;
    const appBetaUrl = process.env[KEY_APP_BETA_URL] as string | undefined;
    const apigatewayIds = JSON.parse(process.env[KEY_APIGW_APPS] as string) as string[];
    const directory = process.env[KEY_DIRECTORY] as string | undefined;
    const host = process.env[KEY_HOST] as string | undefined;
    const title = process.env[KEY_TITLE] as string | undefined;
    const description = process.env[KEY_DESCRIPTION] as string | undefined;
    const removeSecurity = process.env[KEY_REMOVESECURITY] as string | undefined;

    AWSConfig.update({region: process.env[KEY_REGION] as string});

    const apiResponses = await Promise.all(apigatewayIds.map(exportSwaggerApi));
    const apis = apiResponses.map(resp => JSON.parse(resp.body as string));
    const appApi = appUrl ? (await axios.get(appUrl, apiRequestHeaders)).data : [];

    const appBetaApi = appBetaUrl ? [(await axios.get(appBetaUrl, apiRequestHeaders)).data] : [];

    // order is crucial in order for beta for remain at the bottom
    const allApis = appBetaApi.concat(apis).concat([appApi]);

    const merged = mergeApiDescriptions(allApis);

    delete merged.schemes; // always https
    delete merged['x-amazon-apigateway-policy']; // implementation details

    if (host) {
        merged['host'] = host;
        delete merged.basePath;
    }

    if (title) {
        merged.info.title = title;
    }

    if (description) {
        merged.info.description = description;
    }

    if (removeSecurity === 'true') {
        delete merged.securityDefinitions;
        for (const path in merged.paths) {
            for (const method in merged.paths[path]) {
                delete merged.paths[path][method].security;
            }
        }
    }

    const swaggerFilename = 'dt-swagger.js';
    const swaggerFilenameFinal = directory ? `${directory}/${swaggerFilename}` : swaggerFilename;

    const swaggerSpecFilename = 'swagger-spec.json';
    const swaggerSpecFilenameFinal = directory ? `${directory}/${swaggerSpecFilename}` : swaggerSpecFilename;

    await Promise.all([
        uploadToS3(
            bucketName,
            constructSwagger(merged),
            swaggerFilenameFinal
        ),
        uploadToS3(
            bucketName,
            JSON.stringify(merged),
            swaggerSpecFilenameFinal,
            'private',
            'application/json'
        )
    ]);
};
