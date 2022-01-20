import {
    RestApi,
    MethodLoggingLevel,
    GatewayResponse,
    ResponseType,
    EndpointType,
    RestApiProps, JsonSchema, Model,
} from 'aws-cdk-lib/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from 'aws-cdk-lib/aws-iam';
import {Construct} from "constructs";
import {DigitrafficStack} from "./stack";
import {createUsagePlan} from "../usage-plans";
import {ModelWithReference} from "../../types/model-with-reference";
import {getModelReference} from "../../../utils/api-model";
import {MediaType} from "../../types/mediatypes";
import R = require('ramda');

export class DigitrafficRestApi extends RestApi {
    readonly apiKeyIds: string[];

    constructor(
        stack: DigitrafficStack, apiId: string, apiName: string, allowFromIpAddresses?: string[] | undefined, config?: Partial<RestApiProps>,
    ) {
        const policyDocument = allowFromIpAddresses == null ? createDefaultPolicyDocument() : createIpRestrictionPolicyDocument(allowFromIpAddresses);

        // override default config with given extra config
        const apiConfig = {...{
            deployOptions: {
                loggingLevel: MethodLoggingLevel.ERROR,
            },
            restApiName: apiName,
            endpointTypes: [EndpointType.REGIONAL],
            policy: policyDocument,
        }, ...config};

        super(stack, apiId, apiConfig);

        this.apiKeyIds = [];

        add404Support(this, stack);
    }

    hostname(): string {
        return `${this.restApiId}.execute-api.${(this.stack as DigitrafficStack).region}.amazonaws.com`;
    }

    createUsagePlan(apiKeyId: string, apiKeyName: string): string {
        const newKeyId = createUsagePlan(this, apiKeyId, apiKeyName).keyId;

        this.apiKeyIds.push(newKeyId);

        return newKeyId;
    }

    addJsonModel(modelName: string, schema: JsonSchema) {
        return this.getModelWithReference(this.addModel(modelName, {
            contentType: MediaType.APPLICATION_JSON,
            modelName,
            schema,
        }));
    }

    addCSVModel(modelName: string) {
        return this.getModelWithReference(this.addModel(modelName, {
            contentType: MediaType.TEXT_CSV,
            modelName,
            schema: {},
        }));
    }

    private getModelWithReference(model: Model): ModelWithReference {
        return R.assoc('modelReference', getModelReference(model.modelId, this.restApiId), model);
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
            'application/json': '{"message": "Not found"}',
        },
    });
}

export function add401Support(restApi: RestApi, stack: Construct) {
    new GatewayResponse(stack, `AuthenticationFailedResponse-${restApi.restApiName}`, {
        restApi,
        type: ResponseType.UNAUTHORIZED,
        statusCode: "401",
        responseHeaders: {
            'WWW-Authenticate': "'Basic'",
        },
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
export function setReturnCodeForMissingAuthenticationToken(returnCode: number,
    message: string,
    restApi: RestApi,
    stack: Construct) {

    new GatewayResponse(stack, `MissingAuthenticationTokenResponse-${restApi.restApiName}`, {
        restApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: `${returnCode}`,
        templates: {
            'application/json': `{"message": ${message}}`,
        },
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
        policy: policyDocument,
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
                    "execute-api:Invoke",
                ],
                resources: [
                    "*",
                ],
                principals: [
                    new AnyPrincipal(),
                ],
            }),
        ],
    });
}


export function createIpRestrictionPolicyDocument(allowFromIpAddresses: string[]): PolicyDocument {
    return new PolicyDocument({
        statements: [
            new PolicyStatement({
                effect: Effect.ALLOW,
                conditions: {
                    "IpAddress": {
                        "aws:SourceIp": allowFromIpAddresses,
                    },
                },
                actions: [
                    "execute-api:Invoke",
                ],
                resources: [
                    "*",
                ],
                principals: [
                    new AnyPrincipal(),
                ],
            }),
        ],
    });
}
