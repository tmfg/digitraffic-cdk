import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DigitrafficSecurityRule } from "../../aws/infra/security-rule.mjs";
import { Topic } from "aws-cdk-lib/aws-sns";

describe("security-rule tests", () => {    
     test("create", () => {
        const app = new App();
        const stack = new Stack(app);
        const topic = new Topic(stack, "test");

        new DigitrafficSecurityRule(stack, topic);

        const template = Template.fromStack(stack);

        template.hasResource("AWS::Events::Rule", {
            Properties: {
                EventPattern: {
                },
                State: "ENABLED"
            }
        });

    });

});