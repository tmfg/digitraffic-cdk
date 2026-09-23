import { App, Stack } from "aws-cdk-lib";
import type { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { describe, expect, test } from "vitest";
import { AclBuilder } from "../../aws/infra/acl-builder.js";

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
    const acl = createBuilder()
      .withAWSManagedRules(["CommonRuleSet", "AmazonIpReputationList"])
      .build();

    expect(acl.rules).toHaveLength(2);
  });

  test("ip blacklist", () => {
    const acl = createBuilder()
      .withIpBlacklistRule(["1.2.3.4", "1.2.6.6"])
      .build();

    expect(acl.rules).toHaveLength(1);
  });

  test("ip whitelist", () => {
    const acl = createBuilder()
      .withIpWhitelistRule(["1.2.3.4", "1.2.6.6"])
      .build();

    expect(acl.rules).toHaveLength(1);
  });

  test("throttle rules", () => {
    for (const aclBuilder of [
      createBuilder().withThrottleDigitrafficUserIp(100),
      createBuilder().withThrottleDigitrafficUserIpAndUriPath(100),
      createBuilder().withThrottleAnonymousUserIp(100),
      createBuilder().withThrottleAnonymousUserIpAndUriPath(100),
      createBuilder().withThrottleAnonymousUserIpByUriPath(500, /abc/),
    ]) {
      const acl = aclBuilder.build();
      // Check that the rule exists and a custom response is defined
      expect(acl.rules).toHaveLength(1);
      expect(
        Object.keys(acl.customResponseBodies as Record<string, unknown>),
      ).toHaveLength(1);
      // Check that the rule does throttle
      const throttleRule = (acl.rules! as Array<CfnWebACL.RuleProperty>)[0]!;
      expect(
        (throttleRule.statement as CfnWebACL.StatementProperty)
          .rateBasedStatement,
      ).toBeDefined();
      expect(
        (throttleRule.action as CfnWebACL.RuleActionProperty).block,
      ).toBeDefined();
    }
  });

  test("anonymous uri-path throttle can exclude a path", () => {
    const acl = createBuilder()
      .withThrottleAnonymousUserIpAndUriPath(100, /^\/roadnetwork\//)
      .build();
    const rule = (acl.rules as Array<CfnWebACL.RuleProperty>)[0];
    const statement = rule?.statement as CfnWebACL.StatementProperty;
    const rateBased =
      statement.rateBasedStatement as CfnWebACL.RateBasedStatementProperty;
    const scopeDown = rateBased.scopeDownStatement;
    const scopeDownStatement = scopeDown as CfnWebACL.StatementProperty;
    const andStatement =
      scopeDownStatement.andStatement as CfnWebACL.AndStatementProperty;
    const scopeDownStatements = (andStatement.statements ??
      []) as CfnWebACL.StatementProperty[];
    const excludedStatement = scopeDownStatements[1]!;
    const excludedPathStatement =
      excludedStatement.notStatement as CfnWebACL.NotStatementProperty;
    const regexMatchStatement = (
      excludedPathStatement.statement as CfnWebACL.StatementProperty
    ).regexMatchStatement as CfnWebACL.RegexMatchStatementProperty;

    expect(scopeDownStatements).toHaveLength(2);
    expect(regexMatchStatement.regexString).toBe("^\\/roadnetwork\\/");
  });

  test("Cannot define two rules with the same name", () => {
    expect(() =>
      createBuilder()
        .withThrottleAnonymousUserIp(10)
        .withThrottleAnonymousUserIp(200)
        .build(),
    ).toThrow();
  });

  test("throtle rule without limit does nothing", () => {
    for (const aclBuilder of [
      createBuilder().withThrottleDigitrafficUserIp(undefined),
      createBuilder().withThrottleDigitrafficUserIpAndUriPath(undefined),
      createBuilder().withThrottleAnonymousUserIp(undefined),
      createBuilder().withThrottleAnonymousUserIpAndUriPath(undefined),
      createBuilder().withThrottleAnonymousUserIpByUriPath(
        undefined,
        undefined,
      ),
    ]) {
      expect(() => aclBuilder.build()).toThrow("No rules");
    }
  });
});
