import { Stack } from "aws-cdk-lib";
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
