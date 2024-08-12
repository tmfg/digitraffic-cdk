import * as apigateway from "aws-cdk-lib/aws-apigateway";

export const OcpiV2_1_1EndpointSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "OCPI Endpoint",
    properties: {
        identifier: {
            type: apigateway.JsonSchemaType.STRING,
            description: "OCPI endpoint identifier"
        },
        url: {
            type: apigateway.JsonSchemaType.STRING,
            description: "OCPI endpoint url"
        }
    },
    required: ["identifier", "url"]
};

export const OcpiV2_1_1VersionEndpointsSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "OCPI Version Endpoints",
    properties: {
        version: {
            type: apigateway.JsonSchemaType.STRING,
            description: "OCPI version"
        },
        endpoints: {
            type: apigateway.JsonSchemaType.ARRAY,
            description: "OCPI endpoint",
            items: [OcpiV2_1_1EndpointSchema]
        }
    },
    required: ["version", "url"]
};

export const OcpiV2_1_1ImageCategorySchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.ARRAY,
    description: "Details of this party.",
    items: {
        type: apigateway.JsonSchemaType.STRING,
        enum: ["CHARGER", "ENTRANCE", "LOCATION", "NETWORK", "OPERATOR", "OTHER", "OWNER"]
    }
};

export const OcpiV2_1_1ImageSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "Details of this party.",
    properties: {
        url: {
            type: apigateway.JsonSchemaType.STRING,
            description: "URL from where the image data can be fetched through a web browser"
        },
        thumbnail: {
            type: apigateway.JsonSchemaType.STRING,
            description: "URL from where a thumbnail of the image can be fetched through a webbrowser"
        },
        category: OcpiV2_1_1ImageCategorySchema,
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Image type like: gif, jpeg, png, svg"
        },
        width: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: "Width of the full scale image"
        },
        height: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: "Height of the full scale image"
        }
    },
    required: ["url", "category", "type"]
};

export const OcpiV2_1_1CredentialsBusinessDetailsSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "Details of this party.",
    properties: {
        name: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Name of the operator"
        },
        website: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Link to the operator’s website"
        },
        logo: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Link to the operator’s website"
        }
    },
    required: ["name"]
};
export const OcpiV2_1_1CredentialsSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "OCPI 2.1.1 Credentials Endpoints Schema",
    properties: {
        url: {
            type: apigateway.JsonSchemaType.STRING,
            description: "The URL to API versions endpoint"
        },
        token: {
            type: apigateway.JsonSchemaType.STRING,
            description: "The token for the other party to authenticate in your system."
        },
        party_id: {
            type: apigateway.JsonSchemaType.STRING,
            description: "CPO or eMSP ID of this party. (following the 15118 ISO standard)."
        },
        country_code: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Country code of the country this party is operating in."
        },
        business_details: OcpiV2_1_1CredentialsBusinessDetailsSchema
    },
    required: ["url", "token", "party_id", "country_code"]
};
