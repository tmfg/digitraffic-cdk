import { JsonSchemaVersion, type JsonSchema, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

export const dirwaySchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "Winter Navigation Dirway",
    properties: {
        name: {
            type: JsonSchemaType.STRING,
            description: "Name"
        },
        description: {
            type: JsonSchemaType.STRING,
            description: "Description"
        },
        dirwaypoints: {
            type: JsonSchemaType.ARRAY,
            description: "Dirwaypoints",
            items: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    orderNum: {
                        type: JsonSchemaType.NUMBER,
                        description: "Order"
                    },
                    name: {
                        type: JsonSchemaType.STRING,
                        description: "Name"
                    },
                    latitude: {
                        type: JsonSchemaType.NUMBER,
                        description: "Latitude"
                    },
                    longitude: {
                        type: JsonSchemaType.NUMBER,
                        description: "Longitude"
                    }
                }
            }
        }
    }
};
