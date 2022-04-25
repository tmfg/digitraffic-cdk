import {Construct} from "constructs";
import {CfnDocumentationPart, Resource} from "aws-cdk-lib/aws-apigateway";

// Documentation parts are objects that describe an API Gateway API or parts of an API
// https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-documenting-api.html

/**
 * Add description to a query parameter
 * @param name query parameter name
 * @param description query parameter description
 * @param resource REST API resource
 * @param stack CloudFormation stack
 *
 * @deprecated Use DigitrafficRestApi.documentResource
 */
export function addQueryParameterDescription(name: string,
    description: string,
    resource: Resource,
    stack: Construct) {
    new CfnDocumentationPart(stack, `${name}Documentation`, {
        restApiId: resource.api.restApiId,
        location: {
            type: 'QUERY_PARAMETER',
            name,
            path: resource.path,
        },
        properties: JSON.stringify({description}),
    });
}

/**
 * Add a documentation part to a method
 * @param methodDescription
 * @param documentationProperties
 * @param resource REST API resource
 * @param stack CloudFormation stack
 */
export function addDocumentation(methodDescription: string,
    documentationProperties: object,
    resource: Resource,
    stack: Construct) {
    new CfnDocumentationPart(stack, `${methodDescription}Documentation`, {
        restApiId: resource.api.restApiId,
        location: {
            type: 'METHOD',
            path: resource.path,
        },
        properties: JSON.stringify(documentationProperties),
    });
}

/**
 * Adds OpenAPI tags to an API method
 * @param methodDescription Description of API method
 * @param tags OpenAPI tags
 * @param resource REST API resource
 * @param stack CloudFormation stack
 */
export function addTags(methodDescription: string,
    tags: string[],
    resource: Resource,
    stack: Construct) {
    addDocumentation(methodDescription, {tags}, resource, stack);
}

/**
 * Adds OpenAPI tags and a method summary to an API method
 *
 * @deprecated Use DigitrafficRestApi.documentResource
 *
 * @param methodDescription Description of API method
 * @param tags OpenAPI tags
 * @param summary OpenAPI summary
 * @param resource REST API resource
 * @param stack CloudFormation stack
 */
export function addTagsAndSummary(
    methodDescription: string,
    tags: string[],
    summary: string,
    resource: Resource,
    stack: Construct,
) {
    addDocumentation(methodDescription, {tags, summary}, resource, stack);
}

export class DocumentationPart {
    readonly parameterName: string;
    readonly type: string;
    readonly documentationProperties: object;

    private constructor(parameterName: string, documentationProperties: object, type: string) {
        this.parameterName = parameterName;
        this.documentationProperties = documentationProperties;
        this.type = type;
    }

    static queryParameter(parameterName: string, description: string) {
        return new DocumentationPart(parameterName, {description}, "QUERY_PARAMETER");
    }

    static pathParameter(parameterName: string, description: string) {
        return new DocumentationPart(parameterName, {description}, "PATH_PARAMETER");
    }

    static method(tags: string[], name: string, summary: string) {
        return new DocumentationPart(name, {tags, summary}, "METHOD");
    }
}
