import { App } from "aws-cdk-lib";
import { AssetCode } from "aws-cdk-lib/aws-lambda";
import { describe, expect, test } from "vitest";
import { FunctionBuilder } from "../../../aws/infra/stack/dt-function.js";
import type { StackConfiguration } from "../../../aws/infra/stack/stack.js";
import { DigitrafficStack } from "../../../aws/infra/stack/stack.js";

function createStack(): DigitrafficStack {
  const app = new App();
  return new DigitrafficStack(app, "TestStack", {
    shortName: "TEST",
  } as StackConfiguration);
}

function getCode(builder: FunctionBuilder): AssetCode {
  return (builder as unknown as { code: AssetCode }).code;
}

function getHandler(builder: FunctionBuilder): string {
  return (builder as unknown as { handler: string }).handler;
}

describe("FunctionBuilder.withAssetCode", () => {
  test("uses lambdaName as default path", () => {
    const stack = createStack();
    const builder = FunctionBuilder.create(
      stack,
      "feature/subfeature/lambda-implementation",
    );

    const code = getCode(builder);

    expect(code).toBeInstanceOf(AssetCode);
    expect(code.path).toBe(
      "dist/lambda/feature/subfeature/lambda-implementation",
    );
  });

  test("uses custom path when provided", () => {
    const stack = createStack();
    const builder = FunctionBuilder.create(
      stack,
      "feature/subfeature/lambda-implementation",
    ).withAssetCode("feature/subfeature/lambda-implementation");

    const code = getCode(builder);

    expect(code.path).toBe(
      "dist/lambda/feature/subfeature/lambda-implementation",
    );
  });

  test("returns this for chaining when called without exclude", () => {
    const stack = createStack();
    const builder = FunctionBuilder.create(
      stack,
      "feature/subfeature/lambda-implementation",
    );

    expect(
      builder.withAssetCode("feature/subfeature/lambda-implementation"),
    ).toBe(builder);
  });

  test("accepts exclude list and uses correct path", () => {
    const stack = createStack();
    const builder = FunctionBuilder.create(
      stack,
      "feature/shared",
    ).withAssetCode("feature/shared", [
      "handler-a/**",
      "handler-b/**",
      "handler-c/**",
    ]);

    const code = getCode(builder);

    expect(code).toBeInstanceOf(AssetCode);
    expect(code.path).toBe("dist/lambda/feature/shared");
  });

  test("returns this for chaining when called with exclude", () => {
    const stack = createStack();
    const builder = FunctionBuilder.create(stack, "feature/shared");

    expect(builder.withAssetCode("feature/shared", ["handler-a/**"])).toBe(
      builder,
    );
  });

  test("exclude is optional — undefined behaves same as no exclude", () => {
    const stack = createStack();
    const builderWithout = FunctionBuilder.create(stack, "test/lambda");
    const builderWithUndefined = FunctionBuilder.create(
      stack,
      "test/lambda2",
    ).withAssetCode("test/lambda2", undefined);

    expect(getCode(builderWithout).path).toBe("dist/lambda/test/lambda");
    expect(getCode(builderWithUndefined).path).toBe("dist/lambda/test/lambda2");
  });

  test("handler uses basename(path), not the full path", () => {
    const stack = createStack();
    // Without explicit withAssetCode — constructor default
    const builderDefault = FunctionBuilder.create(stack, "feature/shared");
    expect(getHandler(builderDefault)).toBe("shared.handler");

    // With explicit withAssetCode (e.g. to pass exclude) — must also use basename
    const builderExplicit = FunctionBuilder.create(
      stack,
      "feature/shared2",
    ).withAssetCode("feature/shared2", ["handler-a/**"]);
    expect(getHandler(builderExplicit)).toBe("shared2.handler");
  });
});
