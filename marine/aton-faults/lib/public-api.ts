import {Model, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {Function} from 'aws-cdk-lib/aws-lambda';
import {default as FaultSchema} from './model/fault-schema';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MessageModel} from "digitraffic-common/api/response";
import {featureSchema, geojsonSchema} from "digitraffic-common/model/geojson";
import {addServiceModel, getModelReference} from "digitraffic-common/api/utils";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {addQueryParameterDescription, addTags} from "digitraffic-common/api/documentation";
import {DATA_V1_TAGS} from "digitraffic-common/api/tags";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {MonitoredDBFunction} from "digitraffic-common/lambda/monitoredfunction";

export function create(stack: DigitrafficStack): Function {
    const publicApi = new DigitrafficRestApi(stack, 'ATON-public', 'ATON public API');

    createUsagePlan(publicApi, 'ATON Api Key', 'ATON Usage Plan');

    const faultModel = addServiceModel("FaultModel", publicApi, FaultSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(faultModel.modelId, publicApi.restApiId)));
    const faultsModel = addServiceModel("FaultsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(stack, publicApi, faultsModel);
}

function createAnnotationsResource(stack: DigitrafficStack, publicApi: RestApi, faultsJsonModel: Model): Function {
    const getFaultsLambda = MonitoredDBFunction.create(stack, 'get-faults', undefined, {
        reservedConcurrentExecutions: 3,
    });

    const apiResource = publicApi.root.addResource("api");
    const atonResource = apiResource.addResource("aton");
    const v1Resource = atonResource.addResource("v1");
    const resources = v1Resource.addResource("faults");

    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);

    const getFaultsIntegration = defaultIntegration(getFaultsLambda, {
        requestParameters: {
            'integration.request.querystring.language': 'method.request.querystring.language',
            'integration.request.querystring.fixed_in_hours': 'method.request.querystring.fixed_in_hours',
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                language: "$util.escapeJavaScript($input.params('language'))",
                fixed_in_hours: "$util.escapeJavaScript($input.params('fixed_in_hours'))",
            }),
        },
    });

    resources.addMethod("GET", getFaultsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.language': false,
            'method.request.querystring.fixed_in_hours': false,
        },
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, faultsJsonModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel)),
        ],
    });

    addTags('GetFaults', DATA_V1_TAGS, resources, stack);
    addQueryParameterDescription('language', 'Language: en, fi or sv', resources, stack);
    addQueryParameterDescription('fixed_in_hours', 'Show faults that are unfixed or were fixed at most this many hours ago', resources, stack);

    return getFaultsLambda;
}
