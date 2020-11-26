import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "@aws-cdk/aws-apigateway";

export const SubscriptionSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Portcall estimates subscription schema',
    required: ['locode', 'phoneNumber', 'time'],
    properties: {
        locode: {
            type: JsonSchemaType.STRING,
            description: 'Port LOCODE, e.g. FIXXX'
        },
        phoneNumber: {
            type: JsonSchemaType.STRING,
            description: 'Phone number in international format, e.g. +358xxxxxxxxxx'
        },
        time: {
            type: JsonSchemaType.STRING,
            description: 'Time in 24 H format, e.g. 12:30'
        }
    }
};
