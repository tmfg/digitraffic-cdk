import {Construct} from "@aws-cdk/core";
import {CfnDocumentationPart, Resource, RestApi} from "@aws-cdk/aws-apigateway";

export function addDocumentation(
    methodDescription: string,
    documentationProperties: object,
    resource: Resource,
    scope: Construct
) {
    new CfnDocumentationPart(scope, `${methodDescription}Documentation`, {
        restApiId: resource.restApi.restApiId,
        location: {
            type: 'METHOD',
            path: resource.path
        },
        properties: JSON.stringify(documentationProperties)
    });
}

export function addTags(
    methodDescription: string,
    tags: string[],
    resource: Resource,
    scope: Construct
) {
    addDocumentation(methodDescription, {tags}, resource, scope);
}