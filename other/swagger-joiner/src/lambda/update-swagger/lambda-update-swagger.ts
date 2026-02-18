import type {
  PutObjectCommandInput,
  PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { ObjectCannedACL, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { OpenApiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import { openapiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import {
  getEnvVariable,
  getEnvVariableOrElse,
} from "@digitraffic/common/dist/utils/utils";
import ky, { type Options } from "ky";
import { exportSwaggerApi, fixApiGatewayNullable } from "../../apigw-utils.js";
import { UPDATE_SWAGGER_KEYS } from "../../model/keys.js";
import type { HttpMethod } from "../../swagger-utils.js";
import {
  constructSwagger,
  mergeApiDescriptions,
  withDeprecations,
  withoutApisWithoutHttpMethods,
  withoutMethods,
  withoutSecurity,
} from "../../swagger-utils.js";

const apiRequestHeaders: Options = {
  headers: {
    "Accept-Encoding": "gzip",
  },
};

// should be defined in all stacks - throw error if undefined
const bucketName = getEnvVariable(UPDATE_SWAGGER_KEYS.BUCKET_NAME);
//    const region = getEnvVariable(KEY_REGION);
const apigatewayIds = JSON.parse(
  getEnvVariable(UPDATE_SWAGGER_KEYS.APIGW_APPS),
) as string[];

// may not be defined in some stacks
const appUrl = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.APP_URL, undefined);
const appBetaUrl = getEnvVariableOrElse(
  UPDATE_SWAGGER_KEYS.APP_BETA_URL,
  undefined,
);
const directory = getEnvVariableOrElse(
  UPDATE_SWAGGER_KEYS.DIRECTORY,
  undefined,
);
const host = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.HOST, undefined);
const title = getEnvVariableOrElse(UPDATE_SWAGGER_KEYS.TITLE, undefined);
const description = getEnvVariableOrElse(
  UPDATE_SWAGGER_KEYS.DESCRIPTION,
  undefined,
);
const removeSecurity = getEnvVariableOrElse(
  UPDATE_SWAGGER_KEYS.REMOVESECURITY,
  undefined,
);

const SERVICE = "UpdateSwagger" as const;

async function getAppData(
  appUrl: string | undefined,
): Promise<OpenApiSchema[]> {
  if (!appUrl) {
    return [];
  }

  const response = await ky.get(appUrl, apiRequestHeaders).json();

  logger.info({
    method: `${SERVICE}.handler`,
    customResponse: JSON.stringify(response),
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

    return openapiSchema.parse(JSON.parse(schema));
  });

  // add nullable: true in place of broken anyOf: [schema, null] and similar oneOf fields produced by apigw
  apis.forEach(fixApiGatewayNullable);

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

  // Remove HEAD method used for health checks and OPTIONS method added by apigw, as they are not interesting enough.
  merged.paths = withoutMethods(
    merged.paths,
    (method) =>
      method.toLowerCase() === ("head" satisfies HttpMethod) ||
      method.toLowerCase() === ("options" satisfies HttpMethod),
  );

  // Remove APIs that don't have any http methods defined, as they cannot be called anyway
  merged.paths = withoutApisWithoutHttpMethods(merged.paths);

  // add "deprecated" fields where missing
  // api gateway drops these fields from exported descriptions
  merged.paths = withDeprecations(merged.paths);

  const swaggerFilename = "dt-swagger.js";
  const swaggerFilenameFinal = directory
    ? `${directory}/${swaggerFilename}`
    : swaggerFilename;

  const swaggerSpecFilename = "openapi.json";
  const swaggerSpecFilenameFinal = directory
    ? `${directory}/${swaggerSpecFilename}`
    : swaggerSpecFilename;

  const s3: S3 = new S3({});
  await Promise.all([
    doUploadToS3(
      s3,
      bucketName,
      constructSwagger(merged),
      swaggerFilenameFinal,
    ),
    doUploadToS3(
      s3,
      bucketName,
      JSON.stringify(merged),
      swaggerSpecFilenameFinal,
      ObjectCannedACL.private,
      "application/json",
    ),
  ]);
};

function doUploadToS3(
  s3: S3,
  bucketName: string,
  body: string,
  fileName: string,
  cannedAcl?: ObjectCannedACL,
  contentType?: string,
): Promise<PutObjectCommandOutput> {
  const commandInput: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileName,
    Body: body,
  };
  if (cannedAcl) {
    commandInput.ACL = ObjectCannedACL.private;
  }
  if (contentType) {
    commandInput.ContentType = contentType;
  }
  const command = new PutObjectCommand(commandInput);

  return s3.send(command).catch((error: Error) => {
    logger.error({
      method: `${SERVICE}.doUploadToS3`,
      message: `s3.send with file=${fileName} failed`,
      error,
    });
    throw error;
  });
}
