import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";
import { WafRules } from "../../acl/waf-rules.js";
import { CloudfrontCdkStack } from "../../cloudfront-cdk-stack.js";
import { Behavior } from "../../distribution/behavior.js";

const LOG_CONFIG_ARN =
  "arn:aws:cloudfront::123456789012:realtime-log-config/test";

function createStack(
  build: (stack: CloudfrontCdkStack) => void,
): CloudfrontCdkStack {
  const app = new App();
  const stack = new CloudfrontCdkStack(app, "TestStack", {
    env: { account: "123456789012", region: "us-east-1" },
  }).withLogConfig(LOG_CONFIG_ARN);

  build(stack);

  return stack;
}

function getOrigins(stack: CloudfrontCdkStack): Record<string, unknown>[] {
  const template = Template.fromStack(stack);
  const distributions = template.findResources("AWS::CloudFront::Distribution");
  const distribution = Object.values(distributions)[0] as {
    Properties: {
      DistributionConfig: { Origins: Record<string, unknown>[] };
    };
  };

  return distribution.Properties.DistributionConfig.Origins;
}

test("behaviors with the same origin but different settings get distinct origins", () => {
  const stack = createStack((s) =>
    s.withDistribution("test", undefined, (builder) =>
      builder
        .withAliasName("test.digitraffic.fi")
        .withAclRule(WafRules.per5min(200, 100))
        .withBehaviors(
          Behavior.nginxPlain("*", "origin.example.com"),
          Behavior.nginxPlain("api/*", "origin.example.com")
            .withConnectionAttempts(1)
            .withReadTimeout(60),
        ),
    ),
  );

  const origins = getOrigins(stack);

  expect(origins).toHaveLength(2);

  const connectionAttempts = origins
    // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
    .map((origin) => origin["ConnectionAttempts"])
    .sort();
  expect(connectionAttempts).toEqual([1, 3]);
});

test("behaviors with identical origin settings share one origin", () => {
  const stack = createStack((s) =>
    s.withDistribution("test", undefined, (builder) =>
      builder
        .withAliasName("test.digitraffic.fi")
        .withAclRule(WafRules.per5min(200, 100))
        .withBehaviors(
          Behavior.nginxPlain("*", "origin.example.com"),
          Behavior.nginxPlain("api/*", "origin.example.com"),
        ),
    ),
  );

  expect(getOrigins(stack)).toHaveLength(1);
});

test("vpc origins keep a stable id and get suffixed ids for differing settings", () => {
  const stack = createStack((s) =>
    s
      .withVpcOrigin(
        "fargate",
        "arn:aws:elasticloadbalancing:eu-west-1:123456789012:loadbalancer/app/test/abc",
        "lb.example.com",
      )
      .withDistribution("test", undefined, (builder) =>
        builder
          .withAliasName("test.digitraffic.fi")
          .withAclRule(WafRules.per5min(200, 100))
          .withBehaviors(
            Behavior.vpcLb("*", "fargate"),
            Behavior.vpcLb("api/*", "fargate").withConnectionAttempts(1),
          ),
      ),
  );

  const origins = getOrigins(stack);

  expect(origins).toHaveLength(2);

  expect(
    origins
      // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
      .map((origin) => origin["Id"])
      .sort(),
  ).toEqual(["vpcOrigin-fargate", "vpcOrigin-fargate-1"]);
});
