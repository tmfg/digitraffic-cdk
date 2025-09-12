import { MediaType } from "../../types/mediatypes.js";
import {
  type IModel,
  type JsonSchema,
  JsonSchemaType,
  JsonSchemaVersion,
  type MethodResponse,
  Model,
} from "aws-cdk-lib/aws-apigateway";
import { dateFromIsoString } from "../../../utils/date-utils.js";

/**
 * This is velocity-script, that assumes the response to be LambdaResponse(status and body).
 * It will always return the body and status, but if status in something else than 200 OK the content-type
 * will be overridden to text/plain. (it's assumed, that lambda will return error text).
 *
 * Body content must be base64-encoded! use LambdaResponse for this! This way you can also return
 * non-textual content.
 *
 * If fileName is set, then Content-Disposition-header will be set to use it
 * If timestamp is set, then ETag & Last-Modified headers will be set
 */
export const RESPONSE_DEFAULT_LAMBDA = `#set($inputRoot = $input.path('$'))
#if ($inputRoot.status != 200)
#set ($context.responseOverride.status = $inputRoot.status)
#set ($context.responseOverride.header.Content-Type = 'text/plain')
#end
#set ($context.responseOverride.header.Access-Control-Allow-Origin = '*')
#if ("$!inputRoot.timestamp" != "")
#set ($context.responseOverride.header.Last-Modified = $inputRoot.timestamp)
#end
#if ("$!inputRoot.etag" != "")
#set ($context.responseOverride.header.ETag = $inputRoot.etag)
#end
#if ("$!inputRoot.fileName" != "")
#set ($disposition = 'attachment; filename="FN"')
#set ($context.responseOverride.header.Content-Disposition = $disposition.replaceAll('FN', $inputRoot.fileName))
#end
$util.base64Decode($inputRoot.body)`;

/**
 * Use this for deprecated integrations.
 * Will add HTTP headers Deprecation and Sunset to response.
 * Example:
 *  Deprecation: true
 *  Sunset: Tue, 20 Dec 2022 00:00:00 GMT
 * @param sunset Sunset date as string in ISO 8601 date-time format (YYYY-MM-DD)
 */

export const getDeprecatedDefaultLambdaResponse = (sunset?: string): string => {
  const setDeprecationHeaders =
    `#set ($context.responseOverride.header.Deprecation = 'true')
    ${
      sunset
        ? `#set ($context.responseOverride.header.Sunset = '${
          dateFromIsoString(sunset).toUTCString()
        }')`
        : ""
    }`;
  return RESPONSE_DEFAULT_LAMBDA.concat(setDeprecationHeaders);
};

const BODY_FROM_INPUT_PATH = "$input.path('$').body";

/// @deprecated
const messageSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  description: "Response with message",
  properties: {
    message: {
      type: JsonSchemaType.STRING,
      description: "Response message",
    },
  },
};

/// @deprecated
export const MessageModel = {
  contentType: MediaType.APPLICATION_JSON,
  modelName: "MessageResponseModel",
  schema: messageSchema,
};

const NotFoundMessage = "Not found";
export const NotFoundResponse = JSON.stringify({ message: NotFoundMessage });

const InternalServerErrorMessage = "Error";
const InternalServerErrorResponse = JSON.stringify({
  message: InternalServerErrorMessage,
});

const BadRequestMessage = "Bad request";
const BadRequestResponse = JSON.stringify({ message: BadRequestMessage });

/// @deprecated
export const BadRequestResponseTemplate = {
  [MediaType.APPLICATION_JSON]: BadRequestResponse,
};
/// @deprecated
export const NotFoundResponseTemplate = {
  [MediaType.APPLICATION_JSON]: NotFoundResponse,
};
/// @deprecated
export const XmlResponseTemplate = {
  [MediaType.APPLICATION_XML]: BODY_FROM_INPUT_PATH,
};
/// @deprecated
export const InternalServerErrorResponseTemplate = {
  [MediaType.APPLICATION_JSON]: InternalServerErrorResponse,
};

export class DigitrafficMethodResponse {
  static response(
    statusCode: string,
    model: IModel,
    mediaType: MediaType,
    disableCors: boolean = false,
    deprecation: boolean = false,
  ): MethodResponse {
    return {
      statusCode,
      responseModels: {
        [mediaType]: model,
      },
      responseParameters: {
        ...(!disableCors && {
          "method.response.header.Access-Control-Allow-Origin": true,
        }),
        ...(deprecation && {
          "method.response.header.Deprecation": true,
          "method.response.header.Sunset": true,
        }),
      },
    };
  }

  static response200(
    model: IModel,
    mediaType: MediaType = MediaType.APPLICATION_JSON,
  ): MethodResponse {
    return DigitrafficMethodResponse.response("200", model, mediaType, false);
  }

  static response500(
    model: IModel = Model.EMPTY_MODEL,
    mediaType: MediaType = MediaType.APPLICATION_JSON,
  ): MethodResponse {
    return DigitrafficMethodResponse.response("500", model, mediaType, false);
  }

  static response400(
    model: IModel = Model.EMPTY_MODEL,
    mediaType: MediaType = MediaType.APPLICATION_JSON,
  ): MethodResponse {
    return DigitrafficMethodResponse.response("400", model, mediaType, false);
  }
}
