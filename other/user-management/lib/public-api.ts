import {Construct} from '@aws-cdk/core';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {IntegrationResponse}  from '@aws-cdk/aws-apigateway'; // don't remove RestApi! won't work without!

import {createRestApi} from "digitraffic-common/api/rest_apis";
import {defaultLambdaConfiguration} from "digitraffic-common/stack/lambda-configs";
import {defaultIntegration, methodResponse, RESPONSE_500_SERVER_ERROR} from "digitraffic-common/api/responses";
import {addTags} from "digitraffic-common/api/documentation";
import {USER_MANAGEMENT_TAGS} from "digitraffic-common/api/tags";
import {addDefaultValidator, addServiceModel} from "digitraffic-common/api/utils";
import {LOGIN_SCHEMA, LOGIN_SUCCESSFUL_SCHEMA} from './model/login-schema';
import {MessageModel} from "digitraffic-common/api/response";
import {MediaType} from "digitraffic-common/api/mediatypes";

const RESPONSE_200_OK: IntegrationResponse = {
    statusCode: '200',
    responseTemplates: {
        "application/json": "{" +
            "\"username\": \"$input.path('$.accessToken.payload.username')\", " +
            "\"access_token\": $input.json('accessToken.jwtToken'), " +
            "\"auth_time\": $input.path('accessToken.payload.auth_time'), " +
            "\"exp_time\": $input.path('accessToken.payload.exp')" +
            "}"
    }
};

const RESPONSE_401_AUTHORIZATION_FAILED: IntegrationResponse = {
    statusCode: '401',
    selectionPattern: '.*AUTHORIZATION_FAILED.*',
    responseTemplates: {
        "application/json": "Authorization failed. $input.path('$.errorMessage.errorMessage')"
    },
    responseParameters: {
        'method.response.header.WWW-Authenticate': "integration.response.body.errorMessage.errorMessage"
    }
}

export function create(stack: Construct, userManagementProps: any, userPoolId: string, userPoolClientId: string) {
    const publicApi = createRestApi(stack, 'UserManagement', 'UserManagement API');

    return createUserManagementResources(stack, publicApi, userManagementProps, userPoolId, userPoolClientId);
}

function createUserManagementResources(stack: Construct, publicApi: any, userManagementProps: any, userPoolId: string, userPoolClientId: string) {
    const functionName = 'UM-LoginUser';
    const loginUserLambda = new Function(stack, functionName, defaultLambdaConfiguration({
        functionName: functionName,
        memorySize: 512,
        code: new AssetCode('dist/lambda'),
        handler: 'cognito.login_handler',
        environment: {
            USERPOOL_ID: userPoolId,
            CLIENT_ID: userPoolClientId
        }
    }));

    const loginModel = addServiceModel("LoginModel", publicApi, LOGIN_SCHEMA);
    const loginSuccessfulModel = addServiceModel("LoginSuccessfulModel", publicApi, LOGIN_SUCCESSFUL_SCHEMA);
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);

    const loginUserIntegration = defaultIntegration(loginUserLambda, {
        requestTemplates: {
            "application/json":
                "{\"username\": $input.json('username'), " +
                "\"password\": $input.json('password'), " +
                "\"newPassword\": $input.json('newPassword')}"
        },
        disableCors: true,
        responses: [
            RESPONSE_200_OK,
            RESPONSE_401_AUTHORIZATION_FAILED,
            RESPONSE_500_SERVER_ERROR
        ]
    });

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const umResource = v1Resource.addResource("user-management");
    const loginResource = umResource.addResource("login");

    loginResource.addMethod("POST", loginUserIntegration, {
        requestValidator: addDefaultValidator(publicApi),
        requestModels: {
            "application/json": loginModel
        },
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_JSON, loginSuccessfulModel),
            methodResponse("401", MediaType.APPLICATION_JSON, errorResponseModel, {"method.response.header.WWW-Authenticate": true}),
            methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel)
        ]
    });

    addTags('Login', USER_MANAGEMENT_TAGS, loginResource, stack);

}