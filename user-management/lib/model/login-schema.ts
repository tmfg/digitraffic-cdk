import apigateway = require('@aws-cdk/aws-apigateway');

export const LOGIN_SCHEMA: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Login information',
    properties: {
        usename: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Username'
        },
        password: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Password'
        },
        newPassword: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Password'
        }
    },
    required: ["username", "password"]
};

export const LOGIN_SUCCESSFUL_SCHEMA: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Succesful login',
    properties: {
        usename: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Username'
        },
        access_token: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'JWT token'
        },
        auth_time: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Time of authentication(Epoch time)'
        },
        exp_time: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Time of expiration(Epoch time)'
        }
    }
}
