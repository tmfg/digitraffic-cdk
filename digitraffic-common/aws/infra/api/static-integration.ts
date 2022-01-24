import {MockIntegration, PassthroughBehavior, Resource} from "aws-cdk-lib/aws-apigateway";
import {MediaType} from "../../types/mediatypes";
import {corsMethod, RESPONSE_CORS_INTEGRATION} from "./responses";

const INTEGRATION_RESPONSE_200 = `{
    "statusCode": 200
}`;

const METHOD_RESPONSE_200 = {
    statusCode: '200',
};

/**
 * Static integration, that returns the given response with given mediaType from given resource.
 *
 * @param resource
 * @param mediaType
 * @param response
 */
export class DigitrafficStaticIntegration<T> extends MockIntegration {
    constructor(
        resource: Resource, mediaType: MediaType, response: T, enableCors = true, apiKeyRequired = true,
    ) {
        const integrationResponse = DigitrafficStaticIntegration.createIntegrationResponse(response, mediaType, enableCors);

        super({
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            requestTemplates: {
                [mediaType]: INTEGRATION_RESPONSE_200,
            },
            integrationResponses: [integrationResponse],
        });

        resource.addMethod("GET", this, {
            apiKeyRequired,
            methodResponses: [DigitrafficStaticIntegration.createMethodResponse(enableCors)],
        });
    }

    private static createIntegrationResponse<K>(response: K, mediaType: MediaType, enableCors: boolean) {
        const integrationResponse = {
            statusCode: '200',
            responseTemplates: {
                [mediaType]: JSON.stringify(response),
            },
        };

        return enableCors ? {...integrationResponse, ...RESPONSE_CORS_INTEGRATION} : integrationResponse;
    }

    private static createMethodResponse(enableCors: boolean) {
        return enableCors ? corsMethod(METHOD_RESPONSE_200) : METHOD_RESPONSE_200;
    }
}