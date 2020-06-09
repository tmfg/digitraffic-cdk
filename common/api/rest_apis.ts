import {RestApi,MethodLoggingLevel}  from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Construct} from "@aws-cdk/core";
import {EndpointType} from "@aws-cdk/aws-apigateway";

export function createRestApi(stack: Construct, apiId: string, apiName: string, allowFromIpAddresses: string[] | undefined): RestApi {
    const policyDocument = allowFromIpAddresses == null ? createDefaultPolicyDocument() : createIpRestrictionPolicyDocument(allowFromIpAddresses);

    return new RestApi(stack, apiId, {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: apiName,
        endpointTypes: [EndpointType.REGIONAL],
        policy: policyDocument
    });
}

function createDefaultPolicyDocument() {
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
                        "aws:SourceIp": allowFromIpAddresses.join(',')
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