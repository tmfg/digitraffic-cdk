import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {DocumentationPart} from "digitraffic-common/aws/infra/documentation";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {userTypesProperties} from "counting-sites/lib/model/metadata";
import {counterProperties} from "counting-sites/lib/model/counter";
import {featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import {permitProperties} from "./model/excavation-permit";

const EXCAVATION_PERMITS_TAGS = ["Excavation permit(Beta)"];

export class PublicApi {
    publicApi: DigitrafficRestApi;

    private permitsResource: Resource;

    private permitsGeoJsonModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'ExcavationPermits-public', 'Excavation Permits public API');
        this.publicApi.createUsagePlan('EP Api Key', 'EP Usage Plan');

        this.createResources(this.publicApi);
        this.createModels(this.publicApi);

        this.createGeojsonEndpoint(stack);

        this.createDocumentation();
    }

    private createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const evResource = apiResource.addResource("excavation-permit");
        const versionResource = evResource.addResource("beta");

        this.permitsResource = versionResource.addResource("permits");
    }

    createModels(publicApi: DigitrafficRestApi) {
        const permitModel = publicApi.addJsonModel("PermitModel", permitProperties);
        const featureModel = publicApi.addJsonModel("PermitFeatureModel", featureSchema(getModelReference(permitModel.modelId, publicApi.restApiId)));
        this.permitsGeoJsonModel = publicApi.addJsonModel("PermitsGeoJSONModel", geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));
    }

    private createDocumentation() {
        this.publicApi.documentResource(this.permitsResource,
            DocumentationPart.method(EXCAVATION_PERMITS_TAGS, 'GetPermits', 'Return all permits in GeoJSON'));
    }

    private createGeojsonEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-permits-geojson');

        const integration = defaultIntegration(lambda);

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.permitsResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.permitsGeoJsonModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });

    }
}
