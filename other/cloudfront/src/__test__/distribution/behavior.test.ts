import {
  FunctionEventType,
  LambdaEdgeEventType,
} from "aws-cdk-lib/aws-cloudfront";
import { expect, test } from "vitest";
import { Behavior } from "../../distribution/behavior.js";
import { LambdaType } from "../../util/lambda-creator.js";

test("withDirectoryIndexFunction associates an origin-request lambda, not a viewer-request function", () => {
  const behavior = Behavior.s3(
    "tmc/*",
    "tmc-road-prod",
  ).withDirectoryIndexFunction(1);

  // This is the actual fix: a viewer-request Function rewrite runs before the cache lookup and
  // becomes part of the cache key, which is what caused the tmc/roadnetwork collision. Regressing
  // this back to a viewer-request association would reintroduce that bug even though rewriteUri()
  // itself would keep passing its own tests.
  expect(
    behavior.lambdaConfig.lambdas.get(LambdaEdgeEventType.ORIGIN_REQUEST),
  ).toEqual(LambdaType.DIRECTORY_INDEX);
  expect(
    behavior.lambdaConfig.lambdas.has(LambdaEdgeEventType.VIEWER_REQUEST),
  ).toEqual(false);
  expect(
    behavior.lambdaConfig.functions.has(FunctionEventType.VIEWER_REQUEST),
  ).toEqual(false);
});
