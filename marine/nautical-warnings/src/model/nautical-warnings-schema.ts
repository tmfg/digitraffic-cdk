import { JsonSchemaVersion, type JsonSchema, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

export const nauticalWarningSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "Nautical Warning GeoJson",
    properties: {
        id: {
            type: JsonSchemaType.INTEGER,
            description: "Id"
        },
        areasFi: {
            type: JsonSchemaType.STRING,
            description: "Area in Finnish"
        },
        areasSv: {
            type: JsonSchemaType.STRING,
            description: "Area in Swedish"
        },
        areasEn: {
            type: JsonSchemaType.STRING,
            description: "Area in English"
        },
        contentsFi: {
            type: JsonSchemaType.STRING,
            description: "Nautical warning contents in Finnish"
        },
        contentsSv: {
            type: JsonSchemaType.STRING,
            description: "Nautical warning contents in Swedish"
        },
        contentsEn: {
            type: JsonSchemaType.STRING,
            description: "Nautical warning contents in English"
        },
        creationTime: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "Nautical warning creation time"
        },
        fairwayInfo: {
            type: [JsonSchemaType.INTEGER, JsonSchemaType.NULL],
            description: "Fairway features related to the nautical warning (separated by line breaks)"
        },
        locationEn: {
            type: JsonSchemaType.STRING,
            description: "Location specifier in English"
        },
        locationSv: {
            type: JsonSchemaType.STRING,
            description: "Location specifier in Swedish"
        },
        locationFi: {
            type: JsonSchemaType.STRING,
            description: "Location specifier in Finnish"
        },
        navaidInfo: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "Aids to navigation related to the nautical warning"
        },
        navigationLineInfo: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "Navigation line features related to the nautical warning (separated by line breaks)"
        },
        navtex: {
            type: JsonSchemaType.BOOLEAN,
            description: "Is navtex message"
        },
        notificator: {
            type: JsonSchemaType.STRING,
            description: "Notificator"
        },
        number: {
            type: JsonSchemaType.INTEGER,
            description:
                "Nautical warning number. Starts with the digit 1 at the begining of the year. Set when warning was published"
        },
        publishingTime: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "Nautical warning publishing time"
        },
        tooltip: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "Nautical warning contents for tooltip"
        },
        typeFi: {
            type: JsonSchemaType.STRING,
            description: "Nautical warning type in Finnish"
        },
        typeSv: {
            type: JsonSchemaType.STRING,
            description: "Nautical warning type in Swedish"
        },
        typeEn: {
            type: JsonSchemaType.STRING,
            description: "Nautical warning type in English"
        },
        validityStartTime: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            format: "date-time",
            description: "Beginning of validity time"
        },
        validityEndTime: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            format: "date-time",
            description: "End of validity time"
        },
        virtualNavaids: {
            type: JsonSchemaType.BOOLEAN,

            description: "Are there virtual navaids related to this warning"
        }
    }
};
