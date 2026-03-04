import { DependencyTester } from "@digitraffic-cdk/testing";
import { test } from "vitest";

test("circular dependencies", async () => {
  const tester = await DependencyTester.create("lib");

  tester.assertNoCircularDependencies();
  tester.assertNoOrphans();
});
