import {IntegrationResponse} from "@aws-cdk/aws-apigateway";
import {RESPONSE_DEFAULT_LAMBDA} from "./responses";
import {MediaType} from "./mediatypes";

export abstract class DigitrafficIntegrationResponse {
    static ok(mediaType: MediaType): IntegrationResponse {
        return this.create("200", mediaType);
    }

    static create(statusCode: string, mediaType: MediaType): IntegrationResponse {
        const responseTemplates: any = {};
        responseTemplates[mediaType] = RESPONSE_DEFAULT_LAMBDA;

        return {
            statusCode,
            responseTemplates
        }
    }
}

