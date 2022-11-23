import {LambdaIntegration, Resource, RestApi} from "aws-cdk-lib/aws-apigateway";
import {DigitrafficStack} from "@digitraffic/common/dist/aws/infra/stack/stack";
import {DigitrafficRestApi} from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import {MonitoredFunction} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import {DocumentationPart} from "@digitraffic/common/dist/aws/infra/documentation";

const ROAD_NETWORK_CONDITION_ALARMS_TAGS = ["Road Network Condition Alarms"];

export class PublicApi {
    publicApi: DigitrafficRestApi;

    alarmsResource: Resource;
    devicesResource: Resource;
    devicesGeojsonResource: Resource;
    alarmTypesResource: Resource;
    alarmsGeojsonResource: Resource;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, "RoadNetworkConditions-public", "Road Network Conditions Public API");
        this.publicApi.createUsagePlan("Road Network Conditions Api Key", "Road Network Conditions Usage Plan");

        this.createResources(stack);
        this.createLambdaFunctions(stack);

        // this.createDocumentation();
    }

    createDocumentation() {
        this.publicApi.documentResource(this.alarmsResource, DocumentationPart.method(ROAD_NETWORK_CONDITION_ALARMS_TAGS, "GetAlarms", "Returns all alarms"));
        this.publicApi.documentResource(this.devicesResource, DocumentationPart.method(ROAD_NETWORK_CONDITION_ALARMS_TAGS, "GetDevices", "Returns device information"));
        this.publicApi.documentResource(this.devicesGeojsonResource, DocumentationPart.method(ROAD_NETWORK_CONDITION_ALARMS_TAGS, "GetDevicesGeojson", "Returns device information in geojson format"));
        this.publicApi.documentResource(this.alarmTypesResource, DocumentationPart.method(ROAD_NETWORK_CONDITION_ALARMS_TAGS, "GetAlarmTypes", "Returns alarm types"));
        this.publicApi.documentResource(this.alarmsGeojsonResource, DocumentationPart.method(ROAD_NETWORK_CONDITION_ALARMS_TAGS, "GetAlarmsGeojson", "Returns geojson of alarm with alarm type and device information"));
    }

    createResources(stack: DigitrafficStack) {
        const resource = this.publicApi.root
            .addResource("api")
            .addResource("road-network-conditions")
            .addResource("beta");

        this.alarmsResource = resource.addResource("alarms");
        this.devicesResource = resource.addResource("devices");
        this.devicesGeojsonResource = resource.addResource("devices.geojson");
        this.alarmTypesResource = resource.addResource("alarm-types");
        this.alarmsGeojsonResource = resource.addResource("alarms.geojson");
    }

    createLambdaFunctions(stack: DigitrafficStack) {
        const prefix = "RoadNetworkConditions";

        const alarmsLambda = this.createResource(
            stack,
            this.alarmsResource,
            "get-alarms",
            `${prefix}-GetAlarms`,
        );
        const devicesLambda = this.createResource(
            stack,
            this.devicesResource,
            "get-devices",
            `${prefix}-GetDevices`,
        );
        const devicesGeojsonLambda = this.createResource(
            stack,
            this.devicesGeojsonResource,
            "get-devices-geojson",
            `${prefix}-GetDevicesGeojson`,
        );
        const alarmTypesLambda = this.createResource(
            stack,
            this.alarmTypesResource,
            "get-alarm-types",
            `${prefix}-GetAlarmTypes`,
        );
        const alarmsGeojsonLambda = this.createResource(
            stack,
            this.alarmsGeojsonResource,
            "get-alarms-geojson",
            `${prefix}-GetAlarmsGeojson`,
        );
        stack.grantSecret(alarmsLambda, devicesLambda, devicesGeojsonLambda, alarmTypesLambda, alarmsGeojsonLambda);
    }

    createResource(stack: DigitrafficStack, resource: Resource, name: string, functionName: string): MonitoredFunction {
        const env = stack.createLambdaEnvironment();

        const lambda = MonitoredFunction.createV2(stack, name, env, {
            functionName,
            timeout: 10,
        });

        const integration = new LambdaIntegration(lambda, { proxy: true });
        resource.addMethod("GET", integration, { apiKeyRequired: false });
        resource.addMethod("HEAD", integration, { apiKeyRequired: false });

        return lambda;
    }
}
