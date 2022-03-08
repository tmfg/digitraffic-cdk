import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {DocumentationPart} from "digitraffic-common/aws/infra/documentation";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import {permitProperties} from "./model/permit";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";

const STREET_TRAFFIC_MESSAGE_TAGS = ["Street Traffic Message(Beta)"];

export class PublicApi {
    publicApi: DigitrafficRestApi;

    private permitsD2LightResource: Resource;
    private permitsGeojsonResource: Resource;

    private permitsGeoJsonModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'StreetTrafficMessage-public', 'Street Traffic Message public API');
        this.publicApi.createUsagePlan('STM Api Key', 'STM Usage Plan');

        this.createResources(this.publicApi);
        this.createModels(this.publicApi);

        this.createGeojsonEndpoint(stack);
        this.createD2LightEndpoint(stack);

        this.createDocumentation();
    }

    private createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const stmResource = apiResource.addResource("street-traffic-message");
        const versionResource = stmResource.addResource("beta");

        this.permitsGeojsonResource = versionResource.addResource("permits");
        this.permitsD2LightResource = versionResource.addResource("permits.d2light");
    }

    createModels(publicApi: DigitrafficRestApi) {
        const permitModel = publicApi.addJsonModel("PermitModel", permitProperties);
        const featureModel = publicApi.addJsonModel("PermitFeatureModel", featureSchema(getModelReference(permitModel.modelId, publicApi.restApiId)));
        this.permitsGeoJsonModel = publicApi.addJsonModel("PermitsGeoJSONModel", geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));
    }

    private createDocumentation() {
        this.publicApi.documentResource(this.permitsGeojsonResource,
            DocumentationPart.method(STREET_TRAFFIC_MESSAGE_TAGS, 'GetPermits GeoJSON', 'Return all permits in GeoJSON'));

        this.publicApi.documentResource(this.permitsD2LightResource,
            DocumentationPart.method(STREET_TRAFFIC_MESSAGE_TAGS, 'GetPermits D2Light', 'Return all permits in D2Light'));

    }

    private createGeojsonEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-permits-geojson');

        const integration = defaultIntegration(lambda, {
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.permitsGeojsonResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.permitsGeoJsonModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    private createD2LightEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-permits-datex2');

        const integration = defaultIntegration(lambda, {
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.permitsD2LightResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.permitsGeoJsonModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }
}
