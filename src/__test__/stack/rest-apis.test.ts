import { App } from "aws-cdk-lib";
import { DigitrafficRestApi } from "../../aws/infra/stack/rest_apis.js";
import { DigitrafficStack } from "../../aws/infra/stack/stack.js";
import { TrafficType } from "../../types/traffictype.js";
import { Match, Template } from "aws-cdk-lib/assertions";

describe("Rest api test", () => {
    test("OPTIONS method is added to API-gateway", () => {
        const app = new App();
        const stack = new DigitrafficStack(app, "test-stack", {
            alarmTopicArn: "",
            production: false,
            shortName: "test",
            stackProps: {},
            trafficType: TrafficType.ROAD,
            warningTopicArn: "",
        });
        const publicApi = new DigitrafficRestApi(stack, "test", "testName");
        const apiResource = publicApi.root.addResource("api");
        const versionResource = apiResource.addResource("v1");
        const testsResource = publicApi.addResourceWithCorsOptionsSubTree(versionResource, "tests");
        testsResource.addResource("{testId}");

        const template = Template.fromStack(stack);

        template.resourcePropertiesCountIs("AWS::ApiGateway::Method", { HttpMethod: "OPTIONS" }, 2);
        template.hasResource("AWS::ApiGateway::Method", {
            Properties: {
                HttpMethod: "OPTIONS",
                Integration: {
                    IntegrationResponses: Match.arrayWith([
                        Match.objectLike({
                            ResponseParameters: Match.objectEquals({
                                "method.response.header.Access-Control-Allow-Headers":
                                    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Digitraffic-User'",
                                "method.response.header.Access-Control-Allow-Origin": "'*'",
                                "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,GET,HEAD'",
                            }),
                        }),
                    ]),
                },
            },
        });
    });
});
