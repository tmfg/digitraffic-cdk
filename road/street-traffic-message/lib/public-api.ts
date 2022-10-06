import {DigitrafficStack} from "@digitraffic/common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "@digitraffic/common/aws/infra/stack/rest_apis";
import {DocumentationPart} from "@digitraffic/common/aws/infra/documentation";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "@digitraffic/common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "@digitraffic/common/aws/infra/api/responses";
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import {featureSchema, geojsonSchema, getModelReference} from "@digitraffic/common/utils/api-model";
import {permitProperties} from "./model/permit";
import {DigitrafficIntegrationResponse} from "@digitraffic/common/aws/runtime/digitraffic-integration-response";

const STREET_TRAFFIC_MESSAGE_TAGS = ["Street Traffic Message(Beta)"];

export class PublicApi {
    publicApi: DigitrafficRestApi;

    private messagesD2LightResource: Resource;
    private messagesGeojsonResource: Resource;

    private messagesGeoJsonModel: Model;

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

        this.messagesGeojsonResource = versionResource.addResource("messages");
        this.messagesD2LightResource = versionResource.addResource("messages.d2light");
    }

    createModels(publicApi: DigitrafficRestApi) {
        const messageModel = publicApi.addJsonModel("MessageModel", permitProperties);
        const featureModel = publicApi.addJsonModel("MessageFeatureModel", featureSchema(getModelReference(messageModel.modelId, publicApi.restApiId)));
        this.messagesGeoJsonModel = publicApi.addJsonModel("MessagesGeoJSONModel", geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));
    }

    private createDocumentation() {
        this.publicApi.documentResource(this.messagesGeojsonResource,
            DocumentationPart.method(STREET_TRAFFIC_MESSAGE_TAGS, 'GetMessages GeoJSON', 'Return all street traffic messages in GeoJSON'));

        this.publicApi.documentResource(this.messagesD2LightResource,
            DocumentationPart.method(STREET_TRAFFIC_MESSAGE_TAGS, 'GetMessages D2Light', 'Return all street traffic messages in D2Light'));

    }

    private createGeojsonEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-permits-geojson');

        const integration = defaultIntegration(lambda, {
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.messagesGeojsonResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.messagesGeoJsonModel)),
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
            this.messagesD2LightResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.messagesGeoJsonModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }
}
