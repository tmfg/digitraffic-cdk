import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from 'aws-cdk-lib/aws-apigateway';

export const domainsProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Counting Site Domain',
    properties: {
        name: {
            type: JsonSchemaType.STRING,
            format: "string",
            description: 'Domain name',
        },
        description: {
            type: JsonSchemaType.STRING,
            format: "string",
            description: 'Domain description',
        },
        addedTimestamp: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: 'Domain added',
        },
        removedTimestamp: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: 'Domain removed',
        },
    },
};

export const userTypesProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Counting Site Usertype',
    patternProperties: {
        ".*": {
            type: JsonSchemaType.STRING,
            description: 'User type description',
        },
    },
};

export const directionProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Counting Site Directions',
    patternProperties: {
        ".*": {
            type: JsonSchemaType.STRING,
            description: 'Direction description',
        },
    },
};
