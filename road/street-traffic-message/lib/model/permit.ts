import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "aws-cdk-lib/aws-apigateway";
import {Geometry} from "geojson";

export type ApiPermit = {
    readonly sourceId: string
    readonly source: string
    readonly permitSubject: string
    readonly permitType: string
    readonly gmlGeometryXmlString: string
    readonly effectiveFrom: Date
    readonly effectiveTo?: Date
}

export enum PermitType {
    CONSTRUCTION_WORKS = "constructionWorks",
    PUBLIC_EVENT = 'publicEvent',
    GENERAL_INSTRUCTION_OR_MESSAGE_TO_ROAD_USERS = 'generalInstructionOrMessageToRoadUsers',
    OTHER = "other"
}

export type DbPermit = {
    readonly id: string
    readonly sourceId: string
    readonly source: string
    readonly permitType: string
    readonly permitSubject: string
    readonly geometry: Geometry
    readonly effectiveFrom: Date
    readonly effectiveTo?: Date
    readonly createdAt: Date
    readonly updatedAt: Date
    readonly version: number
}

export const permitProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Permit properties',
    properties: {
        id: {
            type: JsonSchemaType.INTEGER,
            description: 'Permit id',
        },
        sourceId: {
            type: JsonSchemaType.STRING,
            description: 'Permit id in source',
        },
        source: {
            type: JsonSchemaType.STRING,
            description: 'Permit source',
        },
        version: {
            type: JsonSchemaType.INTEGER,
            description: 'Permit version',
        },
        permitType: {
            type: JsonSchemaType.STRING,
            description: 'Permit type',
        },
        permitSubject: {
            type: JsonSchemaType.STRING,
            description: 'Permit purpose',
        },
        effectiveFrom: {
            type: JsonSchemaType.STRING,
            format: 'date-time',
            description: 'Permit effective from',
        },
        effectiveTo: {
            type: JsonSchemaType.INTEGER,
            format: 'date-time',
            description: 'Permit effective to',
        },
        createdAt: {
            type: JsonSchemaType.INTEGER,
            format: 'date-time',
            description: 'Permit creation time',
        },
        updatedAt: {
            type: JsonSchemaType.INTEGER,
            format: 'date-time',
            description: 'Permit update time',
        },

    },
};
