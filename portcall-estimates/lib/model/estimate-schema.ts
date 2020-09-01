import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "@aws-cdk/aws-apigateway";

export const ShipSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Portcall estimates ship schema',
    required: ['port'],
    properties: {
        port: {
            type: JsonSchemaType.STRING,
            description: 'Port LOCODE'
        }
    }
};

export const LocationSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Portcall estimates location schema',
    properties: {
        mmsi: {
            type: JsonSchemaType.NUMBER,
            description: 'MMSI'
        },
        imo: {
            type: JsonSchemaType.NUMBER,
            description: 'IMO'
        }
    }
};

export function createEstimateSchema(shipReference: string, locationReference: string): JsonSchema {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: 'Portcall estimates schema',
        required: [
            'eventType',
            'eventTime',
            'recordTime',
            'source',
            'ship',
            'location'
        ],
        properties: {
            eventType: {
                type: JsonSchemaType.STRING,
                enum: ['ATB', 'ETA', 'ETD'],
                description: 'Event type: ATB, ETA, ETD'
            },
            eventTime: {
                type: JsonSchemaType.STRING,
                description: 'Event time in ISO 8601 date format'
            },
            eventTimeConfidenceLower: {
                type: JsonSchemaType.STRING,
                description: 'Event time confidence, lower. ISO 8601 formatted duration'
            },
            eventTimeConfidenceUpper: {
                type: JsonSchemaType.STRING,
                description: 'Event time confidence, upper. ISO 8601 formatted duration'
            },
            recordTime: {
                type: JsonSchemaType.STRING,
                description: 'Timestamp of event creation in ISO 8601 date format'
            },
            source: {
                type: JsonSchemaType.STRING,
                description: 'Event source'
            },
            ship: {
                ref: shipReference
            },
            location: {
                ref: locationReference
            }
        }
    };
}
