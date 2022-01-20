import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from 'aws-cdk-lib/aws-apigateway';

import {DbUserType} from "./usertype";
import {ResultDomain} from "./domain";

export type MetadataResponse = {
    lastUpdated: Date | null;
    domains: ResultDomain[];
    userTypes: DbUserType[];
    directions: Record<string, string>;
};

export const metadataProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Counting Sites Metadata',
    properties: {
        lastUpdated: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: 'Metadate last updated',
        },
        domains: {
            type: JsonSchemaType.ARRAY,
            title: "Counting Site domains",
            items: {
                type: JsonSchemaType.OBJECT,
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
            },
        },
        userTypes: {
            type: JsonSchemaType.OBJECT,
            title: "Counting Site user types",
            patternProperties: {
                ".*": {
                    type: JsonSchemaType.STRING,
                    description: 'User type description',
                },
            },
        },
        directions: {
            type: JsonSchemaType.OBJECT,
            title: "Counting Site directions",
            patternProperties: {
                ".*": {
                    type: JsonSchemaType.STRING,
                    description: 'Direction description',
                },
            },
        },
    },
};