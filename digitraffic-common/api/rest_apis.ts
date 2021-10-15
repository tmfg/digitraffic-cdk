import {RestApi, MethodLoggingLevel, GatewayResponse, ResponseType, EndpointType} from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Construct} from "@aws-cdk/core";
import {DigitrafficStack} from "../stack/stack";

export class DigitrafficRestApi extends RestApi {
    constructor(stack: DigitrafficStack, apiId: string, apiName: string, allowFromIpAddresses?: string[] | undefined, config?: any) {
        const policyDocument = allowFromIpAddresses == null ? createDefaultPolicyDocument() : createIpRestrictionPolicyDocument(allowFromIpAddresses);

        let apiConfig = {
            deployOptions: {
                loggingLevel: MethodLoggingLevel.ERROR,
            },
            restApiName: apiName,
            endpointTypes: [EndpointType.REGIONAL],
            policy: policyDocument
        };

        // override with given extra config
        if(config) {
            apiConfig = {...apiConfig, ...config};
        }

        super(stack, apiId, apiConfig);

        add404Support(this, stack);
    }

    hostname(): string {
        return `${this.restApiId}.execute-api.eu-west-1.amazonaws.com`;
    }
}

/**
 * Due to AWS API design API Gateway will always return 403 'Missing Authentication Token' for requests
 * with a non-existent endpoint. This function translates this response to a 404.
 * Requests with an invalid or missing API key are not affected (still return 403 'Forbidden').
 * @param restApi RestApi
 * @param stack Construct
 */
export function add404Support(restApi: RestApi, stack: Construct) {
    new GatewayResponse(stack, `MissingAuthenticationTokenResponse-${restApi.restApiName}`, {
        restApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: '404',
        templates: {
            'application/json': '{"message": "Not found"}'
        }
    });
}

export function add401Support(restApi: RestApi, stack: Construct) {
    new GatewayResponse(stack, `AuthenticationFailedResponse-${restApi.restApiName}`, {
        restApi,
        type: ResponseType.UNAUTHORIZED,
        statusCode: "401",
        responseHeaders: {
            'WWW-Authenticate': "'Basic'"
        }
    });
}

/**
 * Due to AWS API design API Gateway will always return 403 'Missing Authentication Token' for requests
 * with a non-existent endpoint. This function converts this response to a custom one.
 * Requests with an invalid or missing API key are not affected (still return 403 'Forbidden').
 * @param returnCode
 * @param message
 * @param restApi RestApi
 * @param stack Construct
 */
export function setReturnCodeForMissingAuthenticationToken(
    returnCode: number,
    message: string,
    restApi: RestApi,
    stack: Construct) {

    new GatewayResponse(stack, `MissingAuthenticationTokenResponse-${restApi.restApiName}`, {
        restApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: `${returnCode}`,
        templates: {
            'application/json': `{"message": ${message}}`
        }
    });
}

export function createRestApi(stack: Construct, apiId: string, apiName: string, allowFromIpAddresses?: string[] | undefined): RestApi {
    const policyDocument = allowFromIpAddresses == null ? createDefaultPolicyDocument() : createIpRestrictionPolicyDocument(allowFromIpAddresses);
    const restApi = new RestApi(stack, apiId, {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: apiName,
        endpointTypes: [EndpointType.REGIONAL],
        policy: policyDocument
    });
    add404Support(restApi, stack);
    return restApi;
}

export function createDefaultPolicyDocument() {
    return new PolicyDocument({
        statements: [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    "execute-api:Invoke"
                ],
                resources: [
                    "*"
                ],
                principals: [
                    new AnyPrincipal()
                ]
            })
        ]
    })
}


export function createIpRestrictionPolicyDocument(allowFromIpAddresses: string[]): PolicyDocument {
    return new PolicyDocument({
        statements: [
            new PolicyStatement({
                effect: Effect.ALLOW,
                conditions: {
                    "IpAddress": {
                        "aws:SourceIp": allowFromIpAddresses
                    },
                },
                actions: [
                    "execute-api:Invoke"
                ],
                resources: [
                    "*"
                ],
                principals: [
                    new AnyPrincipal()
                ]
            })
        ]
    })
}
