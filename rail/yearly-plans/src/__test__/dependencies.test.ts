import { DependencyTester } from "@digitraffic-cdk/testing";

test("circular dependencies", async () => {
  const tester = await DependencyTester.create("lib");

  tester.assertNoCircularDependencies();
  tester.assertNoOrphans();
});
