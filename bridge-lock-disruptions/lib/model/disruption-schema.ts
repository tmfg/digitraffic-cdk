import apigateway = require('@aws-cdk/aws-apigateway');

const disruptionsProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Bridge and lock Disruptions GeoJSON',
    properties: {
        Type_Id: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Id of disruption type'
        },
        StartDate: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disruption started date time'
        },
        EndDate: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disruption ended date time'
        },
        DescriptionFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disruption description, finnish'
        },
        DescriptionSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disruption description, swedish'
        },
        DescriptionEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disruption description, english'
        },
        AdditionalInformationFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Additional information, finnish'
        },
        AdditionalInformationSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Additional information, swedish'
        },
        AdditionalInformationEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Additional information, english'
        }
    }
};

export default disruptionsProperties;
