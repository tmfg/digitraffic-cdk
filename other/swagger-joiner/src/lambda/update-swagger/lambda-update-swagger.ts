import ky, { type Options } from "ky";
import {
    constructSwagger,
    mergeApiDescriptions,
    withDeprecations,
    withoutSecurity,
    withoutMethods
} from "../../swagger-utils.js";
import { exportSwaggerApi } from "../../apigw-utils.js";
import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { getEnvVariable, getEnvVariableOrElse } from "@digitraffic/common/dist/utils/utils";
import { openapiSchema, type OpenApiSchema } from "../../model/openapi-schema.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { UPDATE_SWAGGER_KEYS } from "../../model/keys.js";

const apiRequestHeaders: Options = {
    headers: {
        "Accept-Encoding": "gzip"
    }
};

// should be defined in all stacks - throw error if undefined
const bucketName = getEnvVariable(UPDATE_SWAGGER_KEYS.BUCKET_NAME);
//    const region = getEnvVariable(KEY_REGION);
const apigatewayIds = JSON.parse(getEnvVariable(UPDATE_SWAGGER_KEYS.APIGW_APPS)) as string[];

// may not be defined in some stacks
const appUrl = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.APP_URL, undefined);
const appBetaUrl = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.APP_BETA_URL, undefined);
const directory = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.DIRECTORY, undefined);
const host = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.HOST, undefined);
const title = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.TITLE, undefined);
const description = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.DESCRIPTION, undefined);
const removeSecurity = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.REMOVESECURITY, undefined);

async function getAppData(appUrl: string | undefined): Promise<OpenApiSchema[]> {
    if (!appUrl) {
        return [];
    }

    const response = await ky.get(appUrl, apiRequestHeaders).json();

    logger.info({
        method: "UpdateSwagger.handler",
        customResponse: JSON.stringify(response)
    });

    return [openapiSchema.parse(response)];
}

export const handler = async (): Promise<void> => {
    const apiResponses = await Promise.all(apigatewayIds.map(exportSwaggerApi));

    const apis = apiResponses.map((resp) => {
        if (!resp.body) throw new Error("Missing body");
        // seriously AWS, wtf?
        const body: Uint8Array = resp.body;
        const schema = Buffer.from(body.buffer).toString();

        logger.info({
            method: "UpdateSwagger.handler",
            customSchema: schema
        });

        return openapiSchema.parse(JSON.parse(schema));
    });

    const appApi = await getAppData(appUrl);
    const appBetaApi = await getAppData(appBetaUrl);

    // order is crucial in order for beta for remain at the bottom
    const allApis = appBetaApi.concat(apis).concat(appApi);

    const merged = mergeApiDescriptions(allApis);

    if (host) {
        merged.servers = [{ url: host }];
    } else {
        delete merged.servers;
    }

    if (title) {
        merged.info.title = title;
    }

    if (description) {
        merged.info.description = description;
    }

    delete merged.security; // always https

    if (removeSecurity === "true") {
        // This defines the available security schemes, such as api-key in header. Having it adds a button in Swagger
        // that lets you set the key for "Try it" calls.
        if (merged.components?.securitySchemes) {
            delete merged.components.securitySchemes;
        }

        // These define which of the methods actually use the security scheme. Adds a lock icon to the method.
        merged.paths = withoutSecurity(merged.paths);
    }

    // remove HEAD methods used for health checks
    merged.paths = withoutMethods(merged.paths, (method) => method.toUpperCase() === "HEAD");

    // Remove OPTIONS methods added by apigw, as they are not interesting enough.
    merged.paths = withoutMethods(merged.paths, (method) => method.toUpperCase() === "OPTIONS");

    // add "deprecated" fields where missing
    // api gateway drops these fields from exported descriptions
    merged.paths = withDeprecations(merged.paths);

    const swaggerFilename = "dt-swagger.js";
    const swaggerFilenameFinal = directory ? `${directory}/${swaggerFilename}` : swaggerFilename;

    const swaggerSpecFilename = "openapi.json";
    const swaggerSpecFilenameFinal = directory ? `${directory}/${swaggerSpecFilename}` : swaggerSpecFilename;

    await Promise.all([
        uploadToS3(bucketName, constructSwagger(merged), swaggerFilenameFinal),
        uploadToS3(
            bucketName,
            JSON.stringify(merged),
            swaggerSpecFilenameFinal,
            "private",
            "application/json"
        )
    ]);
};
