import { MockIntegration, PassthroughBehavior, type Resource } from "aws-cdk-lib/aws-apigateway";
import { MediaType } from "../../types/mediatypes.js";

const INTEGRATION_RESPONSE_200 = `{
    "statusCode": 200
}`;

/**
 * Static integration, that returns the given response with given mediaType from given resource.
 *
 * @param resource
 * @param mediaType
 * @param response
 */
export class DigitrafficStaticIntegration extends MockIntegration {
    constructor(
        resource: Resource,
        mediaType: MediaType,
        response: string,
        enableCors: boolean = true,
        apiKeyRequired: boolean = true,
        headers: Record<string, string> = {},
    ) {
        if (enableCors) {
            headers = { ...headers, "Access-Control-Allow-Origin": "*" };
        }

        const integrationResponse = DigitrafficStaticIntegration.createIntegrationResponse(
            response,
            mediaType,
            headers,
        );

        super({
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            requestTemplates: {
                [mediaType]: INTEGRATION_RESPONSE_200,
            },
            integrationResponses: [integrationResponse],
        });

        ["GET", "HEAD"].forEach((httpMethod) => {
            resource.addMethod(httpMethod, this, {
                apiKeyRequired,
                methodResponses: [DigitrafficStaticIntegration.createMethodResponse(headers)],
            });
        });
    }

    static json<K>(
        resource: Resource,
        response: K,
        enableCors: boolean = true,
        apiKeyRequired: boolean = true,
        headers: Record<string, string> = {},
    ): DigitrafficStaticIntegration {
        return new DigitrafficStaticIntegration(
            resource,
            MediaType.APPLICATION_JSON,
            JSON.stringify(response),
            enableCors,
            apiKeyRequired,
            headers,
        );
    }

    static createIntegrationResponse(
        response: string,
        mediaType: MediaType,
        headers: Record<string, string> = {},
    ) {
        const params = mapRecord(headers, (entry) => ["method.response.header." + entry[0], `'${entry[1]}'`]);

        return {
            statusCode: "200",
            responseTemplates: {
                [mediaType]: response,
            },
            responseParameters: params,
        };
    }

    static createMethodResponse(headers: Record<string, string>) {
        const allowedHeaders = Object.keys(headers);
        const entries = Object.fromEntries(allowedHeaders.map((key) => [key, true]));

        return {
            statusCode: "200",
            responseParameters: prefixKeys("method.response.header.", entries),
        };
    }
}

function mapRecord<T>(obj: Record<string, T>, func: (entry: [string, T]) => [string, T]): Record<string, T> {
    const mappedEntries = Object.entries(obj).map((entry: [string, T]) => func(entry));
    return Object.fromEntries(mappedEntries);
}

/**
 * Create a new Record with prefix added to each of the keys.
 *
 * @param prefix
 * @param obj
 */
function prefixKeys<T>(prefix: string, obj: Record<string, T>): Record<string, T> {
    return mapRecord(obj, (entry) => [prefix + entry[0], entry[1]]);
}
