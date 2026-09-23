import { App } from "aws-cdk-lib";
import { describe, expect, test } from "vitest";
import type { StackConfiguration } from "../../../aws/infra/stack/stack.js";
import { DigitrafficStack } from "../../../aws/infra/stack/stack.js";
import { EnvKeys } from "../../../aws/runtime/environment.js";
import { TrafficType } from "../../../types/traffictype.js";

function createStack(secretId?: string): DigitrafficStack {
  const configuration: StackConfiguration = {
    shortName: "VS",
    trafficType: TrafficType.ROAD,
    secretId,
    alarmTopicArn: "",
    warningTopicArn: "",
    production: false,
    stackProps: {},
  };

  return new DigitrafficStack(new App(), "TestStack", configuration);
}

describe("DigitrafficStack.createDefaultLambdaEnvironment", () => {
  test("includes the application name without a secret", () => {
    expect(
      createStack().createDefaultLambdaEnvironment("variable-signs"),
    ).toEqual({
      [EnvKeys.APP_NAME]: "road-vs",
      DB_APPLICATION: "variable-signs",
    });
  });

  test("preserves the secret configuration", () => {
    expect(
      createStack("test-secret").createDefaultLambdaEnvironment(
        "variable-signs",
      ),
    ).toEqual({
      [EnvKeys.APP_NAME]: "road-vs",
      DB_APPLICATION: "variable-signs",
      SECRET_ID: "test-secret",
    });
  });
});
