import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import type { DataDumpProps } from "../data-dump-stack.js";
import { DataDumpStack } from "../data-dump-stack.js";

// === Configuration (placeholder values — no real infrastructure identifiers) ===

const CONFIG: DataDumpProps = {
  compositionDumpBucket: "test-composition-bucket",
  trainDumpBucket: "test-train-bucket",
  trainLocationDumpBucket: "test-location-bucket",
  shortName: "DataDump",
  env: { account: "123456789012", region: "eu-west-1" },
};

// === Helpers ===

function createTemplate(): Template {
  const app = new App();
  const stack = new DataDumpStack(app, "Stack", CONFIG);
  return Template.fromStack(stack);
}

function allBucketArns(): string[] {
  return [
    CONFIG.compositionDumpBucket,
    CONFIG.trainDumpBucket,
    CONFIG.trainLocationDumpBucket,
  ].flatMap((bucket) => [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProps(resource: Record<string, unknown>): Record<string, any> {
  return resource["Properties"] as Record<string, unknown>;
}

/**
 * Collect all S3 resource ARNs across all IAM Policy resources in the template.
 * L2 constructs create separate AWS::IAM::Policy resources (not inline on the role).
 */
function collectS3ResourceArns(template: Template): string[] {
  const policies = template.findResources("AWS::IAM::Policy");
  const allStatements = Object.values(policies).flatMap(
    (p) => getProps(p)["PolicyDocument"]?.["Statement"] ?? [],
  );
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
    if (props["FunctionName"] === functionName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleRef = props["Role"] as Record<string, any>;
      if (roleRef?.["Fn::GetAtt"]) {
        return roleRef["Fn::GetAtt"][0] as string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const policies = template.findResources("AWS::IAM::Policy");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allStatements: any[] = [];
  for (const policyId of Object.keys(policies)) {
    const props = getProps(policies[policyId]!);
    const roles = props["Roles"] ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (roles.some((r: any) => r["Ref"] === roleLogicalId)) {
      allStatements.push(...(props["PolicyDocument"]?.["Statement"] ?? []));
    }
  }
  return allStatements;
}

/**
 * Extract S3 resource ARNs from IAM policy statements.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractS3ResourceArns(statements: any[]): string[] {
  const arns: string[] = [];
  for (const stmt of statements) {
    const actions = Array.isArray(stmt["Action"])
      ? stmt["Action"]
      : [stmt["Action"]];
    if (actions.some((a: string) => a.startsWith("s3:"))) {
      const resources = Array.isArray(stmt["Resource"])
        ? stmt["Resource"]
        : [stmt["Resource"]];
      arns.push(...resources);
    }
  }
  return arns;
}

/**
 * Extract unique S3 actions from IAM policy statements.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractS3Actions(statements: any[]): string[] {
  const actionSet = new Set<string>();
  for (const stmt of statements) {
    const actions = Array.isArray(stmt["Action"])
      ? stmt["Action"]
      : [stmt["Action"]];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arnObj = targetArn as Record<string, any>;
  let lambdaLogicalId: string | undefined;

  if (arnObj?.["Fn::GetAtt"]) {
    lambdaLogicalId = arnObj["Fn::GetAtt"][0];
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
});

// ===========================================================================
// 3. CUSTOM LAMBDA LAYER
// ===========================================================================

describe("DataDumpStack — custom Lambda layer", () => {
  test("stack contains exactly one Lambda LayerVersion", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: exactly one LayerVersion exists (shared by all 3 Lambdas)
    template.resourceCountIs("AWS::Lambda::LayerVersion", 1);
  });

  test("Lambda layer is compatible with Python 3.12", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: the LayerVersion has python3.12 in CompatibleRuntimes
    template.hasResourceProperties("AWS::Lambda::LayerVersion", {
      CompatibleRuntimes: Match.arrayWith(["python3.12"]),
    });
  });

  test("Lambda layer has a description", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: the LayerVersion has a non-empty Description
    template.hasResourceProperties("AWS::Lambda::LayerVersion", {
      Description: Match.stringLikeRegexp(".+"),
    });
  });

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
      const layersValue = JSON.stringify(props["Layers"]);
      expect(layersValue).toContain(layerLogicalId);
    }
  });
});

// ===========================================================================
// 4. IAM ROLES
// ===========================================================================

describe("DataDumpStack — IAM roles", () => {
  test("stack contains exactly three IAM roles", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: exactly three IAM roles exist (one per Lambda)
    template.resourceCountIs("AWS::IAM::Role", 3);
  });

  test("IAM roles allow lambda.amazonaws.com to assume", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find all IAM roles
    const roles = template.findResources("AWS::IAM::Role");
    const roleIds = Object.keys(roles);

    // then: roles exist and each allows lambda.amazonaws.com to assume
    expect(roleIds.length).toBe(3);
    for (const logicalId of roleIds) {
      const props = getProps(roles[logicalId]!);
      const statements = props["AssumeRolePolicyDocument"]?.["Statement"] ?? [];
      const lambdaStatement = statements.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => {
          const svc = s["Principal"]?.["Service"];
          return (
            svc === "lambda.amazonaws.com" ||
            (Array.isArray(svc) && svc.includes("lambda.amazonaws.com"))
          );
        },
      );
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement["Effect"]).toBe("Allow");
    }
  });

  test("IAM roles include managed policy for basic execution", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find all IAM roles and serialize them
    const roles = template.findResources("AWS::IAM::Role");
    const roleIds = Object.keys(roles);

    // then: each role references AWSLambdaBasicExecutionRole
    expect(roleIds.length).toBe(3);
    for (const logicalId of roleIds) {
      const roleJson = JSON.stringify(roles[logicalId]);
      expect(roleJson).toContain("AWSLambdaBasicExecutionRole");
    }
  });

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
  test("stack contains exactly three EventBridge rules", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: exactly three EventBridge rules exist
    template.resourceCountIs("AWS::Events::Rule", 3);
  });

  test("each EventBridge rule targets a distinct Lambda", () => {
    // given: the synthesized template
    const template = createTemplate();

    const knownLambdaNames = [
      "DataDump-DumpCompositions",
      "DataDump-DumpTrains",
      "DataDump-DumpTrainLocations",
    ];

    // when: we resolve the target of each rule
    const rules = template.findResources("AWS::Events::Rule");
    const ruleIds = Object.keys(rules);
    expect(ruleIds.length).toBe(3);

    const targetedLambdas = new Set<string>();
    for (const ruleId of ruleIds) {
      const targets = getProps(rules[ruleId]!)["Targets"] ?? [];
      expect(targets.length).toBeGreaterThan(0);
      const fnName = resolveTargetFunctionName(template, targets[0]["Arn"]);
      expect(fnName).toBeDefined();
      expect(knownLambdaNames).toContain(fnName);
      targetedLambdas.add(fnName!);
    }

    // then: each Lambda is targeted by exactly one rule
    expect(targetedLambdas.size).toBe(3);
  });
});

// ===========================================================================
// 6. LAMBDA PERMISSIONS
// ===========================================================================

describe("DataDumpStack — Lambda permissions", () => {
  test("stack contains exactly three Lambda permissions", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: exactly three Lambda permissions exist
    template.resourceCountIs("AWS::Lambda::Permission", 3);
  });

  test("each permission allows events.amazonaws.com to invoke a Lambda", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when: we find all Lambda permissions
    const permissions = template.findResources("AWS::Lambda::Permission");
    const permissionIds = Object.keys(permissions);

    // then: each has correct Principal and Action
    expect(permissionIds.length).toBe(3);
    for (const logicalId of permissionIds) {
      const props = getProps(permissions[logicalId]!);
      expect(props["Action"]).toBe("lambda:InvokeFunction");
      expect(props["Principal"]).toBe("events.amazonaws.com");
    }
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
  const REQUIRED_S3_ACTIONS = ["s3:CreateMultipartUpload", "s3:PutObject"];

  const ALL_LAMBDA_NAMES = [
    "DataDump-DumpCompositions",
    "DataDump-DumpTrains",
    "DataDump-DumpTrainLocations",
  ];

  test("each Lambda role has only PutObject and CreateMultipartUpload", () => {
    // given: the synthesized template
    const template = createTemplate();

    // when/then: each Lambda's role policy includes exactly the required S3 actions
    for (const fnName of ALL_LAMBDA_NAMES) {
      const actions = findS3ActionsForLambda(template, fnName);
      expect(actions.sort()).toEqual(REQUIRED_S3_ACTIONS);
    }
  });
});
