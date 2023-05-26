import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";

export interface ApiCounter {
    readonly id: number;
    readonly domain: string;
    readonly name: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly userType: number;
    readonly interval: number;
    readonly sens: number;
}

export interface DbCounter {
    readonly id: number;
    readonly site_id: number;
    readonly domain_name: string;
    readonly site_domain: string;
    readonly name: string;
    readonly lat: number;
    readonly lon: number;
    readonly user_type_id: number;
    readonly interval: number;
    readonly direction: number;
    readonly created: Date;
    readonly modified: Date;
    readonly last_data_timestamp?: Date;
    readonly removed_timestamp?: Date;
}

export const counterProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "Counting Site Metadata",
    properties: {
        id: {
            type: JsonSchemaType.INTEGER,
            description: "Counter id"
        },
        name: {
            type: JsonSchemaType.STRING,
            description: "Counter name"
        },
        domain: {
            type: JsonSchemaType.STRING,
            description: "Domain name"
        },
        userType: {
            type: JsonSchemaType.INTEGER,
            description: "Counter type"
        },
        interval: {
            type: JsonSchemaType.INTEGER,
            description: "Data recording interval in minutes"
        },
        direction: {
            type: JsonSchemaType.INTEGER,
            description: "Counter direction"
        },
        lastDataTimestamp: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "Timestamp of last data"
        },
        removedTimestamp: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "Removal timestamp"
        },
        dataUpdatedTime: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "Data updated timestamp"
        }
    }
};
