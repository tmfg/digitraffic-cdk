import type { IntegrationResponse } from "aws-cdk-lib/aws-apigateway";
import {
  getDeprecatedDefaultLambdaResponse,
  RESPONSE_DEFAULT_LAMBDA,
} from "../infra/api/response.js";
import { MediaType } from "../types/mediatypes.js";
// biome-ignore lint/complexity/noStaticOnlyClass: FIXME
export abstract class DigitrafficIntegrationResponse {
  static ok(
    mediaType: MediaType,
    deprecation: boolean = false,
    sunset?: string,
  ): IntegrationResponse {
    return DigitrafficIntegrationResponse.create(
      "200",
      mediaType,
      deprecation,
      sunset,
    );
  }

  static badRequest(mediaType?: MediaType): IntegrationResponse {
    return DigitrafficIntegrationResponse.create(
      "400",
      mediaType ?? MediaType.TEXT_PLAIN,
    );
  }

  static notImplemented(mediaType?: MediaType): IntegrationResponse {
    return DigitrafficIntegrationResponse.create(
      "501",
      mediaType ?? MediaType.TEXT_PLAIN,
    );
  }

  static create(
    statusCode: string,
    mediaType: MediaType,
    deprecation: boolean = false,
    sunset?: string,
  ): IntegrationResponse {
    return {
      statusCode,
      responseTemplates: {
        [mediaType]: deprecation
          ? getDeprecatedDefaultLambdaResponse(sunset)
          : RESPONSE_DEFAULT_LAMBDA,
      },
    };
  }
}
