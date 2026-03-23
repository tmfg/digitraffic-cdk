import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, test } from "vitest";
import type { DataDumpProps } from "../data-dump-stack.js";
import { DataDumpStack } from "../data-dump-stack.js";

// === Configuration (placeholder values — no real infrastructure identifiers) ===

const CONFIG: DataDumpProps = {
  shortName: "DataDump",
  compositionDumpBucket: "test-composition-bucket",
  trainDumpBucket: "test-train-bucket",
  trainLocationDumpBucket: "test-location-bucket",
  alarmTopicArn: "arn:aws:sns:eu-west-1:123456789012:alarm-topic",
  warningTopicArn: "arn:aws:sns:eu-west-1:123456789012:warning-topic",
  trafficType: TrafficType.RAIL,
  production: false,
  stackProps: {
    env: { account: "123456789012", region: "eu-west-1" },
  },
};

// === Helpers ===

function createTemplate(): Template {
  const app = new App();
  const stack = new DataDumpStack(app, "Stack", CONFIG);
  return Template.fromStack(stack);
}

const ALL_LAMBDA_NAMES = [
  "DataDump-DumpCompositions",
  "DataDump-DumpTrains",
  "DataDump-DumpTrainLocations",
];

function allBucketArns(): string[] {
  return [
    CONFIG.compositionDumpBucket,
    CONFIG.trainDumpBucket,
    CONFIG.trainLocationDumpBucket,
  ].flatMap((bucket) => [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`]);
}

function getProps(resource: Record<string, unknown>): Record<string, unknown> {
  // biome-ignore lint/complexity/useLiteralKeys: Indexed access
  return resource["Properties"] as Record<string, unknown>;
}

/**
 * Collect all S3 resource ARNs across all IAM Policy resources in the template.
 * L2 constructs create separate AWS::IAM::Policy resources (not inline on the role).
 */
function collectS3ResourceArns(template: Template): string[] {
  const policies = template.findResources("AWS::IAM::Policy");
  const allStatements = Object.values(policies).flatMap((p) => {
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    const policyDoc = getProps(p)["PolicyDocument"] as Record<string, unknown>;
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    return policyDoc?.["Statement"] ?? [];
  });
  return extractS3ResourceArns(allStatements);
}

/**
 * Find the IAM Role logical ID for a Lambda identified by FunctionName.
 * Traces: Lambda → Role property → Fn::GetAtt → logical ID.
 */
function findRoleLogicalIdForLambda(
  template: Template,
  functionName: string,
): string {
  const lambdas = template.findResources("AWS::Lambda::Function");
  for (const logicalId of Object.keys(lambdas)) {
    const props = getProps(lambdas[logicalId]!);
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    if (props["FunctionName"] === functionName) {
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const roleRef = props["Role"] as Record<string, unknown>;
      const fnGetAtt = roleRef?.["Fn::GetAtt"];
      if (Array.isArray(fnGetAtt) && typeof fnGetAtt[0] === "string") {
        return fnGetAtt[0];
      }
    }
  }
  throw new Error(
    `Lambda "${functionName}" not found or has no Role reference`,
  );
}

/**
 * Find IAM Policy statements attached to a specific IAM Role (by logical ID).
 * Collects statements from ALL matching policies (a role may have multiple).
 */
function findPolicyStatementsForRole(
  template: Template,
  roleLogicalId: string,
): unknown[] {
  const policies = template.findResources("AWS::IAM::Policy");

  const allStatements: unknown[] = [];
  for (const policyId of Object.keys(policies)) {
    const props = getProps(policies[policyId]!);
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    const roles = (props["Roles"] as unknown[]) ?? [];

    if (
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      roles.some((r) => (r as Record<string, unknown>)["Ref"] === roleLogicalId)
    ) {
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const policyDoc = props["PolicyDocument"] as Record<string, unknown>;
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const statements = (policyDoc?.["Statement"] as unknown[]) ?? [];
      allStatements.push(...statements);
    }
  }
  return allStatements;
}

/**
 * Extract S3 resource ARNs from IAM policy statements.
 */

function extractS3ResourceArns(statements: unknown[]): string[] {
  const arns: string[] = [];
  for (const stmt of statements) {
    const s = stmt as Record<string, unknown>;
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    const actions = Array.isArray(s["Action"])
      ? // biome-ignore lint/complexity/useLiteralKeys: Indexed access
        (s["Action"] as unknown[])
      : // biome-ignore lint/complexity/useLiteralKeys: Indexed access
        [s["Action"]];
    if (actions.some((a) => typeof a === "string" && a.startsWith("s3:"))) {
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const resources = Array.isArray(s["Resource"])
        ? // biome-ignore lint/complexity/useLiteralKeys: Indexed access
          (s["Resource"] as unknown[])
        : // biome-ignore lint/complexity/useLiteralKeys: Indexed access
          [s["Resource"]];
      arns.push(...(resources as string[]));
    }
  }
  return arns;
}

/**
 * Extract unique S3 actions from IAM policy statements.
 */

function extractS3Actions(statements: unknown[]): string[] {
  const actionSet = new Set<string>();
  for (const stmt of statements) {
    const s = stmt as Record<string, unknown>;
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    const actions = Array.isArray(s["Action"])
      ? // biome-ignore lint/complexity/useLiteralKeys: Indexed access
        (s["Action"] as unknown[])
      : // biome-ignore lint/complexity/useLiteralKeys: Indexed access
        [s["Action"]];
    for (const a of actions) {
      if (typeof a === "string" && a.startsWith("s3:")) {
        actionSet.add(a);
      }
    }
  }
  return [...actionSet];
}

/**
 * Find S3 resource ARNs from the IAM Policy for a specific Lambda (by FunctionName).
 * Convenience: traces Lambda → Role → Policy → S3 resource ARNs.
 */
function findS3ResourceArnsForLambda(
  template: Template,
  functionName: string,
): string[] {
  const roleLogicalId = findRoleLogicalIdForLambda(template, functionName);
  const statements = findPolicyStatementsForRole(template, roleLogicalId);
  return extractS3ResourceArns(statements);
}

/**
 * Find S3 actions from the IAM Policy for a specific Lambda (by FunctionName).
 */
function findS3ActionsForLambda(
  template: Template,
  functionName: string,
): string[] {
  const roleLogicalId = findRoleLogicalIdForLambda(template, functionName);
  const statements = findPolicyStatementsForRole(template, roleLogicalId);
  return extractS3Actions(statements);
}

/**
 * Resolve a Lambda target ARN from an EventBridge rule to the Lambda's FunctionName.
 * L2 rules use {"Fn::GetAtt": ["<logicalId>", "Arn"]} for the target.
 */
function resolveTargetFunctionName(
  template: Template,
  targetArn: unknown,
): string | undefined {
  const arnObj = targetArn as Record<string, unknown>;
  let lambdaLogicalId: string | undefined;

  const fnGetAtt = arnObj?.["Fn::GetAtt"];
  if (Array.isArray(fnGetAtt)) {
    lambdaLogicalId = fnGetAtt[0] as string;
  } else {
    // Fallback: check JSON for any Lambda logical ID reference
    const serialized = JSON.stringify(targetArn);
    const lambdas = template.findResources("AWS::Lambda::Function");
    for (const id of Object.keys(lambdas)) {
      if (serialized.includes(id)) {
        lambdaLogicalId = id;
        break;
      }
    }
  }

  if (!lambdaLogicalId) return undefined;

  const lambdas = template.findResources("AWS::Lambda::Function");
  const lambdaResource = lambdas[lambdaLogicalId];
  if (!lambdaResource) return undefined;
  // biome-ignore lint/complexity/useLiteralKeys: Indexed access
  return getProps(lambdaResource)["FunctionName"] as string;
}

// ===========================================================================
// 1. STACK SYNTHESIS
// ===========================================================================

describe("DataDumpStack — stack synthesis", () => {
  test("stack synthesizes without errors", () => {
    // given/when: synthesizing the template
    const template = createTemplate();

    // then: template exists
    expect(template.toJSON()).toBeDefined();
  });
});

// ===========================================================================
// 2. LAMBDA FUNCTIONS
// ===========================================================================

describe("DataDumpStack — Lambda functions", () => {
  test("stack contains exactly three Lambda functions", () => {
    // given/when: the synthesized template
    const template = createTemplate();

    // then: exactly three Lambda functions exist
    template.resourceCountIs("AWS::Lambda::Function", 3);
  });

  test("each Lambda receives the correct dump bucket from config", () => {
    // given: the synthesized template
    const template = createTemplate();

    // then: each Lambda has the correct DUMP_BUCKET_NAME from config
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpCompositions",
      Environment: {
        Variables: { DUMP_BUCKET_NAME: CONFIG.compositionDumpBucket },
      },
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpTrains",
      Environment: {
        Variables: { DUMP_BUCKET_NAME: CONFIG.trainDumpBucket },
      },
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpTrainLocations",
      Environment: {
        Variables: { DUMP_BUCKET_NAME: CONFIG.trainLocationDumpBucket },
      },
    });
  });

  test("each Lambda has the correct memory size", () => {
    // given: the synthesized template
    const template = createTemplate();

    // then: compositions = 128, trains = 512, locations = 2048
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpCompositions",
      MemorySize: 128,
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpTrains",
      MemorySize: 512,
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpTrainLocations",
      MemorySize: 2048,
    });
  });

  test("each Lambda has the correct handler", () => {
    // given: the synthesized template
    const template = createTemplate();

    // then: each Lambda's Handler matches {filename}.lambda_handler
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpCompositions",
      Handler: "dump-compositions.lambda_handler",
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpTrains",
      Handler: "dump-trains.lambda_handler",
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "DataDump-DumpTrainLocations",
      Handler: "dump-train-locations.lambda_handler",
    });
  });
});

// ===========================================================================
// 3. CUSTOM LAMBDA LAYER
// ===========================================================================

describe("DataDumpStack — custom Lambda layer", () => {
  test("all three Lambdas reference the custom layer", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find the single LayerVersion logical ID
    const layers = template.findResources("AWS::Lambda::LayerVersion");
    const layerLogicalIds = Object.keys(layers);
    expect(layerLogicalIds.length).toBe(1);
    const layerLogicalId = layerLogicalIds[0]!;

    // then: each Lambda's Layers array contains a Ref to the layer
    const lambdas = template.findResources("AWS::Lambda::Function");
    const lambdaIds = Object.keys(lambdas);
    expect(lambdaIds.length).toBe(3);

    for (const logicalId of lambdaIds) {
      const props = getProps(lambdas[logicalId]!);
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const layersValue = JSON.stringify(props["Layers"]);
      expect(layersValue).toContain(layerLogicalId);
    }
  });
});

// ===========================================================================
// 4. IAM ROLES
// ===========================================================================

describe("DataDumpStack — IAM roles", () => {
  test("S3 permissions exist for all dump buckets", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we collect all S3 resource ARNs from IAM Policy resources
    const s3Arns = collectS3ResourceArns(template);

    // then: all dump bucket ARNs (derived from props) are present
    for (const arn of allBucketArns()) {
      expect(s3Arns).toContain(arn);
    }
  });
});

// ===========================================================================
// 5. EVENTBRIDGE RULES
// ===========================================================================

describe("DataDumpStack — EventBridge rules", () => {
  test("each EventBridge rule targets a distinct Lambda", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we resolve the target of each rule
    const rules = template.findResources("AWS::Events::Rule");
    const ruleIds = Object.keys(rules);
    expect(ruleIds.length).toBe(3);

    const targetedLambdas = new Set<string>();
    for (const ruleId of ruleIds) {
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const targets = (getProps(rules[ruleId]!)["Targets"] as unknown[]) ?? [];
      expect(targets.length).toBeGreaterThan(0);
      const firstTarget = targets[0] as Record<string, unknown>;
      // biome-ignore lint/complexity/useLiteralKeys: Indexed access
      const fnName = resolveTargetFunctionName(template, firstTarget["Arn"]);
      expect(fnName).toBeDefined();
      expect(ALL_LAMBDA_NAMES).toContain(fnName);
      targetedLambdas.add(fnName!);
    }

    // then: each Lambda is targeted by exactly one rule
    expect(targetedLambdas.size).toBe(3);
  });

  test("EventBridge rules have correct cron schedules", () => {
    // given: the synthesized template
    const template = createTemplate();

    // then: each cron schedule matches the expected expression
    template.hasResourceProperties("AWS::Events::Rule", {
      Name: "CompositionCronEvent",
      ScheduleExpression: "cron(17 15 5 * ? *)",
    });
    template.hasResourceProperties("AWS::Events::Rule", {
      Name: "TrainCronEvent",
      ScheduleExpression: "cron(17 14 5 * ? *)",
    });
    template.hasResourceProperties("AWS::Events::Rule", {
      Name: "TrainLocationCronEvent",
      ScheduleExpression: "cron(17 12 * * ? *)",
    });
  });
});

// ===========================================================================
// 7. S3 PERMISSION SCOPING
// ===========================================================================

describe("DataDumpStack — S3 permission scoping", () => {
  test("DumpCompositions role has S3 access only to composition dump bucket", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find the S3 resource ARNs for the compositions Lambda's role
    const s3Arns = findS3ResourceArnsForLambda(
      template,
      "DataDump-DumpCompositions",
    );

    // then: only composition dump bucket ARNs are present
    expect(s3Arns).toContain(`arn:aws:s3:::${CONFIG.compositionDumpBucket}`);
    expect(s3Arns).toContain(`arn:aws:s3:::${CONFIG.compositionDumpBucket}/*`);
    expect(s3Arns).toHaveLength(2);
  });

  test("DumpTrains role has S3 access only to train dump bucket", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find the S3 resource ARNs for the trains Lambda's role
    const s3Arns = findS3ResourceArnsForLambda(template, "DataDump-DumpTrains");

    // then: only train dump bucket ARNs are present
    expect(s3Arns).toContain(`arn:aws:s3:::${CONFIG.trainDumpBucket}`);
    expect(s3Arns).toContain(`arn:aws:s3:::${CONFIG.trainDumpBucket}/*`);
    expect(s3Arns).toHaveLength(2);
  });

  test("DumpTrainLocations role has S3 access only to train location dump bucket", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find the S3 resource ARNs for the train locations Lambda's role
    const s3Arns = findS3ResourceArnsForLambda(
      template,
      "DataDump-DumpTrainLocations",
    );

    // then: only train location dump bucket ARNs are present
    expect(s3Arns).toContain(`arn:aws:s3:::${CONFIG.trainLocationDumpBucket}`);
    expect(s3Arns).toContain(
      `arn:aws:s3:::${CONFIG.trainLocationDumpBucket}/*`,
    );
    expect(s3Arns).toHaveLength(2);
  });
});

// ===========================================================================
// 8. S3 ACTION SET — MINIMUM REQUIRED ONLY
// ===========================================================================

describe("DataDumpStack — S3 actions", () => {
  const REQUIRED_S3_ACTIONS = ["s3:PutObject"];

  test("each Lambda role has only PutObject", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: each Lambda's role policy includes exactly the required S3 actions
    for (const fnName of ALL_LAMBDA_NAMES) {
      const actions = findS3ActionsForLambda(template, fnName);
      expect(actions.sort()).toEqual(REQUIRED_S3_ACTIONS);
    }
  });
});
