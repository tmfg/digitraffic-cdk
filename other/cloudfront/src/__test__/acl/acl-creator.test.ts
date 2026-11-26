import { Stack } from "aws-cdk-lib";
import type { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { expect, test } from "vitest";
import { createWebAcl } from "../../acl/acl-creator.js";
import { WafRules } from "../../acl/waf-rules.js";

test("create without rules", () => {
  const stack = new Stack();

  expect(() => createWebAcl(stack, "test", [], "testDistribution")).toThrow();
});

test("create default rules", () => {
  const stack = new Stack();

  const acl = createWebAcl(
    stack,
    "test",
    [WafRules.per5min(50, 50)],
    "testDistribution",
  );
  expect(acl.rules).toHaveLength(6);
});

test("create rules with geoblock", () => {
  const stack = new Stack();

  const acl = createWebAcl(
    stack,
    "test",
    [WafRules.per5min(50, 50).withGeoblock("CN")],
    "testDistribution",
  );
  const rules = acl.rules as CfnWebACL.RuleProperty[];
  const geoBlock = rules.find((rule) => rule.name === "GeoBlock");

  expect(rules).toHaveLength(7);
  expect(geoBlock?.action).toEqual({ block: {} });
  expect(geoBlock?.statement).toEqual({
    geoMatchStatement: { countryCodes: ["CN"] },
  });
});
