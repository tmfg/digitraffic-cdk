import apigateway = require('@aws-cdk/aws-apigateway');

const TypeIdDescription = `Id of disturbance type:
1 - Lock malfunction
2 - Opening bridge malfunction
3 - Fairway restriction
`;

const disruptionsProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Waterway traffic disturbances GeoJSON',
    properties: {
        Id: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Id of disturbance'
        },
        Type_Id: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: TypeIdDescription
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
