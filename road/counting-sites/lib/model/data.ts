import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "aws-cdk-lib/aws-apigateway";

export type ApiData = {
    readonly date: string
    readonly isoDate: Date
    readonly counts: number|null
    readonly status: number|null
}

export type DbData = {
    readonly counter_id: number;
    readonly data_timestamp: Date
    readonly interval: number
    readonly count: number
    readonly status: number
}

export type ResponseData = {
    readonly counterId: number;
    readonly dataTimestamp: Date
    readonly interval: number
    readonly count: number
    readonly status: number
}

export type DbCsvData = {
    readonly domain_name: string
    readonly counter_name: string
    readonly user_type: string
    readonly data_timestamp: Date
    readonly interval: number
    readonly count: number
    readonly status: number
}

export const dataProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.ARRAY,
    description: 'Counting Sites data',
    items: {
        type: JsonSchemaType.OBJECT,
        properties: {
            dataTimestamp: {
                type: JsonSchemaType.STRING,
                format: "date-time",
                description: 'Data interval start',
            },
            interval: {
                type: JsonSchemaType.NUMBER,
                description: 'Interval length in minutes',
            },
            count: {
                type: JsonSchemaType.NUMBER,
                description: 'Counter count',
            },
            status: {
                type: JsonSchemaType.NUMBER,
                description: 'Counter status',
            },
        },
    },
};
