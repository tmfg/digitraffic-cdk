import {Model, Resource, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {faultsSchema} from './model/fault-schema';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import {DocumentationPart} from "digitraffic-common/aws/infra/documentation";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";

const ATON_FAULTS_TAGS = ['Aton Faults'];

export function create(stack: DigitrafficStack): DigitrafficRestApi {
    const publicApi = new DigitrafficRestApi(stack, 'ATON-public', 'ATON public API');

    publicApi.createUsagePlan('ATON Api Key', 'ATON Usage Plan');

    const faultModel = publicApi.addJsonModel("FaultModel", faultsSchema);
    const featureModel = publicApi.addJsonModel("FeatureModel", featureSchema(getModelReference(faultModel.modelId, publicApi.restApiId)));
    const faultsModel = publicApi.addJsonModel("FaultsModel", geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    const faultsResource = createFaultsResource(stack, publicApi, faultsModel);

    publicApi.documentResource(faultsResource, DocumentationPart.method(ATON_FAULTS_TAGS, 'GetActiveFaults', 'Return all active faults in GeoJSON'));
    publicApi.documentResource(faultsResource, DocumentationPart.queryParameter('language', 'Language: en, fi or sv (default en)'));
    publicApi.documentResource(faultsResource, DocumentationPart.queryParameter('fixed_in_hours', 'Show faults that are unfixed or were fixed at most this many hours ago (default 7 days)'));

    return publicApi;
}

function createFaultsResource(stack: DigitrafficStack, publicApi: RestApi, faultsJsonModel: Model): Resource {
    const getFaultsLambda = MonitoredDBFunction.create(stack, 'get-faults', undefined, {
        reservedConcurrentExecutions: 3,
    });

    const apiResource = publicApi.root.addResource("api");
    const atonResource = apiResource.addResource("aton");
    const v1Resource = atonResource.addResource("v1");
    const faultsResource = v1Resource.addResource("faults");

    const getFaultsIntegration = defaultIntegration(getFaultsLambda, {
        requestParameters: {
            'integration.request.querystring.language': 'method.request.querystring.language',
            'integration.request.querystring.fixed_in_hours': 'method.request.querystring.fixed_in_hours',
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                language: "$util.escapeJavaScript($input.params('language'))",
                // eslint-disable-next-line camelcase
                fixed_in_hours: "$util.escapeJavaScript($input.params('fixed_in_hours'))",
            }),
        },
        responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
    });

    ['GET', 'HEAD'].forEach(httpMethod => {
        faultsResource.addMethod(httpMethod, getFaultsIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.querystring.language': false,
                'method.request.querystring.fixed_in_hours': false,
            },
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, faultsJsonModel)),
            ],
        });
    });

    return faultsResource;
}
