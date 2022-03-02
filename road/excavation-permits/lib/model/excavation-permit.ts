import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "aws-cdk-lib/aws-apigateway";
import {Geometry} from "geojson";

export type ApiExcavationPermit = {
    readonly id: string;
    readonly subject: string;
    readonly gmlGeometryXmlString: string;
    readonly effectiveFrom: Date;
    readonly effectiveTo: Date;
}

export type DbPermit = {
    readonly id: string
    readonly subject: string
    readonly geometry: Geometry
    readonly effectiveFrom: Date
    readonly effectiveTo?: Date
}

export const permitProperties: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'Excavation Permit properties',
    properties: {
        id: {
            type: JsonSchemaType.INTEGER,
            description: 'Permit id',
        },
        subject: {
            type: JsonSchemaType.STRING,
            description: 'Permit subject',
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
    },
};
