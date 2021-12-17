import apigateway = require('aws-cdk-lib/aws-apigateway');

const nauticalWarningProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Nautical Warning GeoJson',
    properties: {
        id: {
            type: apigateway.JsonSchemaType.INTEGER,
            description: 'Id',
        },
        areasFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Area in Finnish',
        },
        areasSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Area in Swedish',
        },
        areasEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Area in English',
        },
        contentsFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Nautical warning contents in Finnish',
        },
        contentsSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Nautical warning contents in Swedish',
        },
        contentsEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Nautical warning contents in English',
        },
        creationTime: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Nautical warning creation time',
        },
        fairwayInfo: {
            type: [apigateway.JsonSchemaType.INTEGER, apigateway.JsonSchemaType.NULL],
            description: 'Fairway features related to the nautical warning (separated by line breaks)',
        },
        locationEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Location specifier in English',
        },
        locationSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Location specifier in Swedish',
        },
        locationFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Location specifier in Finnish',
        },
        navaidInfo: {
            type: [apigateway.JsonSchemaType.STRING, apigateway.JsonSchemaType.NULL],
            description: 'Aids to navigation related to the nautical warning',
        },
        navigationLineInfo: {
            type: [apigateway.JsonSchemaType.STRING, apigateway.JsonSchemaType.NULL],
            description: 'Navigation line features related to the nautical warning (separated by line breaks)',
        },
        navtex: {
            type: apigateway.JsonSchemaType.BOOLEAN,
            description: 'Is navtex message',
        },
        notificator: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Notificator',
        },
        number: {
            type: apigateway.JsonSchemaType.INTEGER,
            description: 'Nautical warning number. Starts with the digit 1 at the begining of the year. Set when warning was published',
        },
        publishingTime: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Nautical warning publishing time',
        },
        tooltip: {
            type: [apigateway.JsonSchemaType.STRING, apigateway.JsonSchemaType.NULL],
            description: 'Nautical warning contents for tooltip',
        },
        typeFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Nautical warning type in Finnish',
        },
        typeSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Nautical warning type in Swedish',
        },
        typeEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Nautical warning type in English',
        },
        validityStartTime: {
            type: [apigateway.JsonSchemaType.STRING, apigateway.JsonSchemaType.NULL],
            format: "date-time",
            description: 'Beginning of validity time',
        },
        validityEndTime: {
            type: [apigateway.JsonSchemaType.STRING, apigateway.JsonSchemaType.NULL],
            format: "date-time",
            description: 'End of validity time',
        },
        virtualNavaids: {
            type: apigateway.JsonSchemaType.BOOLEAN,

            description: 'Are there virtual navaids related to this warning',
        },
    },
};

export default nauticalWarningProperties;
