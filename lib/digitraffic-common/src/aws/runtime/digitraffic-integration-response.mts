import type { IntegrationResponse } from "aws-cdk-lib/aws-apigateway";
import { MediaType } from "../types/mediatypes.mjs";
import { getDeprecatedDefaultLambdaResponse, RESPONSE_DEFAULT_LAMBDA } from "../infra/api/response.mjs";

export abstract class DigitrafficIntegrationResponse {
    static ok(mediaType: MediaType, sunset?: string): IntegrationResponse {
        return this.create("200", mediaType, sunset);
    }

    static badRequest(mediaType?: MediaType): IntegrationResponse {
        return this.create("400", mediaType ?? MediaType.TEXT_PLAIN);
    }

    static notImplemented(mediaType?: MediaType): IntegrationResponse {
        return this.create("501", mediaType ?? MediaType.TEXT_PLAIN);
    }

    static create(statusCode: string, mediaType: MediaType, sunset?: string): IntegrationResponse {
        return {
            statusCode,
            responseTemplates: {
                [mediaType]: sunset ? getDeprecatedDefaultLambdaResponse(sunset) : RESPONSE_DEFAULT_LAMBDA,
            },
        };
    }
}
