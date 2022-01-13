import {EndpointType, IModel, MethodLoggingLevel, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {Function} from 'aws-cdk-lib/aws-lambda';
import {Construct} from "constructs";
import {default as DisruptionSchema} from './model/disruption-schema';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/aws/infra/stack/subscription';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {addServiceModel, featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import {databaseFunctionProps} from "digitraffic-common/aws/infra/stack/lambda-configs";
import {addTags} from "digitraffic-common/aws/infra/documentation";
import {createUsagePlan} from "digitraffic-common/aws/infra/usage-plans";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";

export function create(secret: ISecret,
    stack: DigitrafficStack) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'BridgeLock Api Key', 'BridgeLock Usage Plan');

    const disruptionModel = addServiceModel("DisruptionModel", publicApi, DisruptionSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(disruptionModel.modelId, publicApi.restApiId)));
    const disruptionsModel = addServiceModel("DisruptionsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    createDisruptionsResource(publicApi, disruptionsModel, secret, stack);
}

function createDisruptionsResource(publicApi: RestApi,
    disruptionsJsonModel: IModel,
    secret: ISecret,
    stack: DigitrafficStack): Function {

    const functionName = 'BridgeLockDisruption-GetDisruptions';
    const environment = stack.createDefaultLambdaEnvironment('BridgeLockDisruption');

    const getDisruptionsLambda = MonitoredFunction.create(stack, functionName, databaseFunctionProps(
        stack, environment, functionName, 'get-disruptions', {
            timeout: 60,
            reservedConcurrentExecutions: 3,
        },
    ));

    secret.grantRead(getDisruptionsLambda);

    const resources = createResourcePaths(publicApi);
    const getDisruptionsIntegration = defaultIntegration(getDisruptionsLambda, {
        responses: [
            DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON),
        ],
    });

    ['GET', 'HEAD'].forEach(httpMethod => {
        resources.addMethod(httpMethod, getDisruptionsIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, disruptionsJsonModel)),
            ],
        });
    });

    new DigitrafficLogSubscriptions(stack, getDisruptionsLambda);

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
                        "execute-api:Invoke",
                    ],
                    resources: [
                        "*",
                    ],
                    principals: [
                        new AnyPrincipal(),
                    ],
                }),
            ],
        }),
    });
}
