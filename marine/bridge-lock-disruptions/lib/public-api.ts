import {EndpointType, MethodLoggingLevel, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {default as DisruptionSchema} from './model/disruption-schema';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MessageModel} from "digitraffic-common/api/response";
import {featureSchema, geojsonSchema} from "digitraffic-common/model/geojson";
import {addDefaultValidator, addServiceModel, getModelReference} from "digitraffic-common/api/utils";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {addTags} from "digitraffic-common/api/documentation";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";

export function create(
    secret: ISecret,
    stack: DigitrafficStack) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'BridgeLock Api Key', 'BridgeLock Usage Plan');

    const validator = addDefaultValidator(publicApi);

    const disruptionModel = addServiceModel("DisruptionModel", publicApi, DisruptionSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(disruptionModel.modelId, publicApi.restApiId)));
    const disruptionsModel = addServiceModel("DisruptionsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    createDisruptionsResource(publicApi, disruptionsModel, validator, secret, stack);
}

function createDisruptionsResource(
    publicApi: RestApi,
    disruptionsJsonModel: any,
    validator: RequestValidator,
    secret: ISecret,
    stack: DigitrafficStack): Function {

    const functionName = 'BridgeLockDisruption-GetDisruptions';
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const assetCode = new AssetCode('dist/lambda/get-disruptions');
    const environment = stack.createDefaultLambdaEnvironment('BridgeLockDisruption');

    const getDisruptionsLambda = MonitoredFunction.create(stack, functionName, dbFunctionProps(stack, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-disruptions.handler',
        timeout: 60,
        environment
    }));

    secret.grantRead(getDisruptionsLambda);

    const resources = createResourcePaths(publicApi);
    const getDisruptionsIntegration = defaultIntegration(getDisruptionsLambda);

    resources.addMethod("GET", getDisruptionsIntegration, {
        apiKeyRequired: true,
        requestValidator: validator,
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, disruptionsJsonModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel))
        ]
    });

    createSubscription(getDisruptionsLambda, functionName, stack.configuration.logsDestinationArn, stack);
    addTags('GetDisruptions', ['bridge-lock-disruptions'], resources, stack);

    return getDisruptionsLambda;
}

function createResourcePaths(publicApi: RestApi) {
    const apiResource = publicApi.root.addResource("api");
    const v2Resource = apiResource.addResource("v2");
    const bridgeLockResource = v2Resource.addResource("bridge-lock");
    return bridgeLockResource.addResource("disruptions");
}

function createApi(stack: Construct) {
    return new RestApi(stack, 'BridgeLockDisruption-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        description: 'Waterway traffic disturbances',
        restApiName: 'BridgeLockDisruption public API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new AnyPrincipal()
                    ]
                })
            ]
        })
    });
}
