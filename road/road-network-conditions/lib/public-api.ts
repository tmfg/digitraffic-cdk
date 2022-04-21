import {LambdaIntegration, Resource, RestApi} from "aws-cdk-lib/aws-apigateway";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";

export class PublicApi {
    publicApi: DigitrafficRestApi;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, "RoadNetworkConditions-public", "Road Network Conditions Public API");
        this.publicApi.createUsagePlan("Road Network Conditions Api Key", "Road Network Conditions Usage Plan");

        const resource = this.publicApi.root
            .addResource("api")
            .addResource("road-network-conditions")
            .addResource("beta");

        const prefix = "RoadNetworkConditions";

        const alarmsLambda = this.createResource(
            stack,
            resource,
            "get-alarms",
            `${prefix}-GetAlarms`,
            "alarms",
        );
        const devicesLambda = this.createResource(
            stack,
            resource,
            "get-devices",
            `${prefix}-GetDevices`,
            "devices",
        );
        const alarmTypesLambda = this.createResource(
            stack,
            resource,
            "get-alarm-types",
            `${prefix}-GetAlarmTypes`,
            "alarm-types",
        );
        const featureCollectionLambda = this.createResource(
            stack,
            resource,
            "get-feature-collection",
            `${prefix}-GetFeatureCollection`,
            "feature-collection.geojson",
        );
        stack.grantSecret(alarmsLambda, devicesLambda, alarmTypesLambda, featureCollectionLambda);
    }

    createResource(stack: DigitrafficStack, resource: Resource, name: string, functionName: string, pathPart: string): MonitoredFunction {
        const env = stack.createLambdaEnvironment();

        const lambda = MonitoredFunction.createV2(stack, name, env, {
            functionName,
            timeout: 10,
        });

        const integration = new LambdaIntegration(lambda, { proxy: true });
        const getAlarmsResource = resource.addResource(pathPart);
        getAlarmsResource.addMethod("GET", integration, { apiKeyRequired: false });

        return lambda;
    }
}
