import {Model, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {default as FaultSchema} from './model/fault-schema';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MessageModel} from "digitraffic-common/api/response";
import {featureSchema, geojsonSchema} from "digitraffic-common/model/geojson";
import {addServiceModel, getModelReference} from "digitraffic-common/api/utils";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {addQueryParameterDescription, addTags} from "digitraffic-common/api/documentation";
import {BETA_TAGS} from "digitraffic-common/api/tags";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";

export function create(stack: DigitrafficStack, secret: ISecret): Function {
    const publicApi = new DigitrafficRestApi(stack, 'ATON-public', 'ATON public API');

    createUsagePlan(publicApi, 'ATON Api Key', 'ATON Usage Plan');

    const faultModel = addServiceModel("FaultModel", publicApi, FaultSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(faultModel.modelId, publicApi.restApiId)));
    const faultsModel = addServiceModel("FaultsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(stack, secret, publicApi, faultsModel);
}

function createAnnotationsResource(stack: DigitrafficStack, secret: ISecret, publicApi: RestApi, faultsJsonModel: Model): Function {
    const functionName = 'ATON-GetFaults';
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const assetCode = new AssetCode('dist/lambda/get-faults');
    const environment = stack.createDefaultLambdaEnvironment('ATON');

    const getFaultsLambda = MonitoredFunction.create(stack, functionName, dbFunctionProps(stack, {
        environment,
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-faults.handler',
        readOnly: true
    }), TrafficType.MARINE);

    secret.grantRead(getFaultsLambda);

    const apiResource = publicApi.root.addResource("api");
    const atonResource = apiResource.addResource("aton");
    const v1Resource = atonResource.addResource("v1");
    const resources = v1Resource.addResource("faults");

    const getFaultsIntegration = defaultIntegration(getFaultsLambda, {
        requestParameters: {
            'integration.request.querystring.language': 'method.request.querystring.language',
            'integration.request.querystring.fixed_in_hours': 'method.request.querystring.fixed_in_hours'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                language: "$util.escapeJavaScript($input.params('language'))",
                fixed_in_hours: "$util.escapeJavaScript($input.params('fixed_in_hours'))"
            })
        }
    });

    resources.addMethod("GET", getFaultsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.language': false,
            'method.request.querystring.fixed_in_hours': false
        },
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, faultsJsonModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel))
        ]
    });

    createSubscription(getFaultsLambda, functionName, stack.configuration.logsDestinationArn, stack);

    addTags('GetFaults', BETA_TAGS, resources, stack);
    addQueryParameterDescription('language', 'Language: en, fi or sv', resources, stack);
    addQueryParameterDescription('fixed_in_hours', 'Show faults that are unfixed or were fixed at most this many hours ago', resources, stack);

    return getFaultsLambda;
}
