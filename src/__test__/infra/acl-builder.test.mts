import { AclBuilder } from "../../aws/infra/acl-builder.mjs";
import { App, Stack } from "aws-cdk-lib";
import { expect } from "@jest/globals";
import type { CfnWebACL } from "aws-cdk-lib/aws-wafv2";

describe("acl-builder tests", () => {
    function createBuilder(): AclBuilder {
        const app = new App();
        const stack = new Stack(app);

        return new AclBuilder(stack);
    }

    test("no rules", () => {
        expect(() => createBuilder().build()).toThrow();
    });

    test("default rules", () => {
        const acl = createBuilder().withAWSManagedRules().build();

        expect(acl.rules).toHaveLength(4);
    });

    test("two aws rules", () => {
        const acl = createBuilder().withAWSManagedRules(["CommonRuleSet", "AmazonIpReputationList"]).build();

        expect(acl.rules).toHaveLength(2);
    });

    test("ip restriction", () => {
        const acl = createBuilder().withIpRestrictionRule(["1.2.3.4", "1.2.6.6"]).build();

        expect(acl.rules).toHaveLength(1);
    });

    test("throttle rules", () => {
        for (const aclBuilder of [
            createBuilder().withThrottleDigitrafficUserIp(100),
            createBuilder().withThrottleDigitrafficUserIpAndUriPath(100),
            createBuilder().withThrottleAnonymousUserIp(100),
            createBuilder().withThrottleAnonymousUserIpAndUriPath(100),
        ]) {
            const acl = aclBuilder.build();
            // Check that the rule exists and a custom response is defined
            expect(acl.rules).toHaveLength(1);
            expect(Object.keys(acl.customResponseBodies as Record<any, any>)).toHaveLength(1);
            // Check that the rule does throttle
            const throttleRule = (acl.rules! as Array<CfnWebACL.RuleProperty>)[0]!;
            expect((throttleRule.statement as CfnWebACL.StatementProperty).rateBasedStatement).toBeDefined();
            expect((throttleRule.action as CfnWebACL.RuleActionProperty).block).toBeDefined();
        }
    });

    test("Cannot define two rules with the same name", () => {
        expect(() =>
            createBuilder().withThrottleAnonymousUserIp(10).withThrottleAnonymousUserIp(200).build()
        ).toThrow();
    });

    test("throtle rule without limit does nothing", () => {
        for (const aclBuilder of [
            createBuilder().withThrottleDigitrafficUserIp(undefined),
            createBuilder().withThrottleDigitrafficUserIpAndUriPath(undefined),
            createBuilder().withThrottleAnonymousUserIp(null),
            createBuilder().withThrottleAnonymousUserIpAndUriPath(null),
        ]) {
            expect(() => aclBuilder.build()).toThrowError("No rules");
        }
    });
});
