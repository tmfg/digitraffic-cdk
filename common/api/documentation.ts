import {Construct} from "@aws-cdk/core";
import {CfnDocumentationPart, Resource, RestApi} from "@aws-cdk/aws-apigateway";

// Documentation parts are objects that describe an API Gateway API or parts of an API
// https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-documenting-api.html

/**
 * Add a documentation part to a method
 * @param methodDescription
 * @param documentationProperties
 * @param resource REST API resource
 * @param stack CloudFormation stack
 */
export function addDocumentation(
    methodDescription: string,
    documentationProperties: object,
    resource: Resource,
    stack: Construct
) {
    new CfnDocumentationPart(stack, `${methodDescription}Documentation`, {
        restApiId: resource.restApi.restApiId,
        location: {
            type: 'METHOD',
            path: resource.path
        },
        properties: JSON.stringify(documentationProperties)
    });
}

/**
 * Adds OpenAPI tags to an API method
 * @param methodDescription Description of API method
 * @param tags OpenAPI tags
 * @param resource REST API resource
 * @param stack CloudFormation stack
 */
export function addTags(
    methodDescription: string,
    tags: string[],
    resource: Resource,
    stack: Construct
) {
    addDocumentation(methodDescription, {tags}, resource, stack);
}