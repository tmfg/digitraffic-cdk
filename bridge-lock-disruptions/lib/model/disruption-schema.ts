import apigateway = require('@aws-cdk/aws-apigateway');

const disruptionsProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Waterway traffic disturbances GeoJSON',
    properties: {
        Id: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Id of disruption'
        },
        Type_id: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Id of disruption type'
        },
        StartDate: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disturbance started date time'
        },
        EndDate: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disturbance ended date time'
        },
        DescriptionFi: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disturbance description, finnish'
        },
        DescriptionSv: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disturbance description, swedish'
        },
        DescriptionEn: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Disturbance description, english'
        }
    }
};

export default disruptionsProperties;
