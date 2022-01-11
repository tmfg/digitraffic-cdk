import {IntegrationResponse} from "aws-cdk-lib/aws-apigateway";
import {MediaType} from "../types/mediatypes";
import {RESPONSE_DEFAULT_LAMBDA} from "../../api/responses";

export abstract class DigitrafficIntegrationResponse {

    static ok(mediaType: MediaType): IntegrationResponse {
        return this.create("200", mediaType);
    }

    static badRequest(mediaType?: MediaType): IntegrationResponse {
        return this.create("400", mediaType ?? MediaType.TEXT_PLAIN);
    }

    static create(statusCode: string, mediaType: MediaType): IntegrationResponse {
        const responseTemplates: Record<string, string> = {};
        responseTemplates[mediaType] = RESPONSE_DEFAULT_LAMBDA;

        return {
            statusCode,
            responseTemplates,
        };
    }
}

