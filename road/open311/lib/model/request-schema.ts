import apigateway = require("aws-cdk-lib/aws-apigateway");

const schema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description:
        "Open311 service request model from https://github.com/open311/schema-validation",
    properties: {
        service_request_id: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Unique ID of the service request created.",
        },
        status: {
            type: apigateway.JsonSchemaType.STRING,
            enum: ["open", "closed"],
            description: "Current status of the service request.",
        },
        status_notes: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "Explanation of why status was changed to current state or more details on current status than conveyed with status alone.",
        },
        service_name: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description: "The human readable name of the service request type.",
        },
        service_code: {
            type: apigateway.JsonSchemaType.STRING,
            description: "The unique identifier for the service request type",
        },
        description: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                    maxLength: 4000,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "A full description of the request or report submitted.",
        },
        agency_responsible: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "Agency responsible for fulfilling or otherwise addressing the service request.",
        },
        service_notice: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "Information about the action expected to fulfill the request or otherwise address the information reported.",
        },
        requested_datetime: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: "Date and time when the service request was made.",
        },
        updated_datetime: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                    format: "date-time",
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "Date and time when the service request was last modified. For requests with status=closed, this will be the date the request was closed.",
        },
        expected_datetime: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                    format: "date-time",
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "The date and time when the service request can be expected to be fulfilled. This may be based on a service-specific service level agreement.",
        },
        address: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "Human readable address or description of location. This should be provided from most specific to most general geographic unit, eg address number or cross streets, street name, neighborhood/district, city/town/village, county, postal code.",
        },
        address_id: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "Internal address ID used by a jurisdictions master address repository or other addressing system.",
        },
        zipcode: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "postal code for the location of the service request. (Redundant and field might be removed as it should be part of adress string)",
        },
        lat: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.NUMBER,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description: "latitude using the (WGS84) projection.",
        },
        long: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.NUMBER,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description: "longitude using the (WGS84) projection.",
        },
        media_url: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                    format: "uri",
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description:
                "URL to media associated with the request, eg an image. A convention for parsing media from this URL has yet to be established, so currently it will be done on a case by case basis much like Twitter.com does. For example, if a jurisdiction accepts photos submitted via Twitpic.com, then clients can parse the page at the Twitpic URL for the image given the conventions of Twitpic.com. This could also be a URL to a media RSS feed where the clients can parse for media in a more structured way.",
        },
    },
};

export default schema;
