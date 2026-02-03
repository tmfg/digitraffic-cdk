import { App, Duration } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Architecture, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { FunctionBuilder } from "../../aws/infra/stack/dt-function.js";
import { DigitrafficStack } from "../../aws/infra/stack/stack.js";
import { EnvKeys } from "../../aws/runtime/environment.js";
import { TrafficType } from "../../types/traffictype.js";

const TEST_ENV_VAR = "TEST_ENV_VAR" as const;
const TEST_ENV_VALUE = "testValue" as const;

// AWS::Lambda::Function Template Reference
// https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-lambda-function.html

describe("FunctionBuilder test", () => {
  function createTemplate(
    tester: (builder: FunctionBuilder) => void,
    plain: boolean = false,
    lambdaName: string = "test",
  ): Template {
    const app = new App();
    const stack = new DigitrafficStack(app, "test-stack", {
      alarmTopicArn: "",
      production: false,
      shortName: "test",
      stackProps: {},
      secretId: "testSecret",
      trafficType: TrafficType.ROAD,
      warningTopicArn: "",
    });

    const environment = {
      [TEST_ENV_VAR]: TEST_ENV_VALUE,
    };

    const builder = plain
      ? FunctionBuilder.plain(stack, lambdaName)
          .withEnvironment(environment)
          .withCode(Code.fromInline("{}"))
      : FunctionBuilder.create(stack, lambdaName)
          .withoutDatabaseAccess()
          .withEnvironment(environment)
          .withCode(Code.fromInline("{}"));

    tester(builder);
    builder.build();

    return Template.fromStack(stack);
  }

  function expectEnvironmentValue(
    template: Template,
    key: string,
    value: string,
  ): void {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: Match.objectLike({
          [key]: value,
        }),
      },
    });
  }

  function expectEnvironmentValueMissing(
    template: Template,
    key: string,
  ): void {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: Match.objectLike({
          [key]: Match.absent(),
        }),
      },
    });
  }

  test("default builder", () => {
    const template = createTemplate((_builder: FunctionBuilder) => {});

    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [EnvKeys.SECRET_ID]: "testSecret",
          [TEST_ENV_VAR]: TEST_ENV_VALUE,
        },
      },
      Runtime: Runtime.NODEJS_24_X.name,
      MemorySize: 128,
      Timeout: 60,
      Handler: "test.handler",
    });
  });

  test("plain builder", () => {
    const template = createTemplate((_builder: FunctionBuilder) => {}, true);

    expectEnvironmentValue(template, TEST_ENV_VAR, TEST_ENV_VALUE);
    expectEnvironmentValueMissing(template, EnvKeys.SECRET_ID);
  });

  test("withoutSecretAccess does not add secret-related environment variable", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withoutSecretAccess();
    });

    expectEnvironmentValueMissing(template, EnvKeys.SECRET_ID);
  });

  test("Lambda runtime is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withRuntime(Runtime.NODEJS_24_X);
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: Runtime.NODEJS_24_X.name,
    });
  });

  test("Lambda description is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withDescription("Does something useful");
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Description: "Does something useful",
    });
  });

  test("Lambda memory size is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withMemorySize(256);
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      MemorySize: 256,
    });
  });

  test("Lambda architecture is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withArchitecture(Architecture.X86_64);
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Architectures: [Architecture.X86_64.name],
    });
  });

  test("Lambda timeout is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withTimeout(Duration.seconds(120));
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Timeout: 120,
    });
  });

  test("Lambda reserved concurrency is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withReservedConcurrentExecutions(5);
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      ReservedConcurrentExecutions: 5,
    });
  });

  test("Lambda handler is set", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withHandler("custom", "main");
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "custom.main",
    });
  });

  test("Lambda handler module is resolved from path last element", () => {
    const template = createTemplate(
      (_builder: FunctionBuilder) => {},
      false,
      "api/charging-network/v1/operators",
    );

    // const lambdas = template.findResources("AWS::Lambda::Function");
    // console.debug(JSON.stringify(lambdas, null, 2));
    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "operators.handler",
    });
  });

  test("Lambda handler module is same as lambda name", () => {
    const template = createTemplate(
      (_builder: FunctionBuilder) => {},
      false,
      "operators",
    );

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "operators.handler",
    });
  });

  test("withRolePolicies adds custom policy to lambda role", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withRolePolicies(
        new PolicyStatement({
          actions: ["s3:GetObject"],
          resources: ["arn:aws:s3:::my-bucket/*"],
        }),
      );
    });

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::my-bucket/*",
          }),
        ]),
      },
    });
  });

  test("withAllowedActions adds policy with specified actions", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder.withAllowedActions("dynamodb:PutItem", "dynamodb:GetItem");
    });

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["dynamodb:PutItem", "dynamodb:GetItem"],
            Resource: "*",
          }),
        ]),
      },
    });
  });

  test("withRolePolicies and withAllowedActions can be used together", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder
        .withRolePolicies(
          new PolicyStatement({
            actions: ["s3:GetObject"],
            resources: ["arn:aws:s3:::my-bucket/*"],
          }),
        )
        .withAllowedActions("dynamodb:PutItem", "dynamodb:GetItem");
    });

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::my-bucket/*",
          }),
          Match.objectLike({
            Action: ["dynamodb:PutItem", "dynamodb:GetItem"],
            Resource: "*",
          }),
        ]),
      },
    });
  });

  test("Multiple withRolePolicies calls add multiple policies", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder
        .withRolePolicies(
          new PolicyStatement({
            actions: ["s3:GetObject"],
            resources: ["arn:aws:s3:::my-bucket/*"],
          }),
        )
        .withRolePolicies(
          new PolicyStatement({
            actions: ["sqs:SendMessage"],
            resources: ["arn:aws:sqs:us-east-1:123456789012:my-queue"],
          }),
        );
    });

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::my-bucket/*",
          }),
          Match.objectLike({
            Action: "sqs:SendMessage",
            Resource: "arn:aws:sqs:us-east-1:123456789012:my-queue",
          }),
        ]),
      },
    });
  });

  test("Multiple withAllowedActions calls accumulate actions", () => {
    const template = createTemplate((builder: FunctionBuilder) => {
      builder
        .withAllowedActions("dynamodb:PutItem", "dynamodb:GetItem")
        .withAllowedActions("s3:ListBucket");
    });

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["dynamodb:PutItem", "dynamodb:GetItem", "s3:ListBucket"],
            Resource: "*",
          }),
        ]),
      },
    });
  });

  test("withRole and withRolePolicies work together", () => {
    const app = new App();
    const stack = new DigitrafficStack(app, "test-stack", {
      alarmTopicArn: "",
      production: false,
      shortName: "test",
      stackProps: {},
      secretId: "testSecret",
      trafficType: TrafficType.ROAD,
      warningTopicArn: "",
    });

    // Create a custom role
    const customRole = new Role(stack, "CustomRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    FunctionBuilder.plain(stack, "test")
      .withCode(Code.fromInline("{}"))
      .withRole(customRole)
      .withRolePolicies(
        new PolicyStatement({
          actions: ["s3:GetObject"],
          resources: ["arn:aws:s3:::my-bucket/*"],
        }),
      )
      .withAllowedActions("dynamodb:Query")
      .build();

    const template = Template.fromStack(stack);

    // Verify the custom role is used
    template.hasResourceProperties("AWS::Lambda::Function", {
      Role: Match.objectLike({
        "Fn::GetAtt": Match.arrayWith([Match.stringLikeRegexp("CustomRole")]),
      }),
    });

    // Verify the policies are attached
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::my-bucket/*",
          }),
          Match.objectLike({
            Action: "dynamodb:Query",
            Resource: "*",
          }),
        ]),
      },
    });
  });

  test("withAllowedActions throws error when wildcard action is used", () => {
    const app = new App();
    const stack = new DigitrafficStack(app, "test-stack", {
      alarmTopicArn: "",
      production: false,
      shortName: "test",
      stackProps: {},
      secretId: "testSecret",
      trafficType: TrafficType.ROAD,
      warningTopicArn: "",
    });

    expect(() => {
      FunctionBuilder.plain(stack, "test")
        .withCode(Code.fromInline("{}"))
        .withAllowedActions("*")
        .build();
    }).toThrow(
      'Lambda test-Test cannot use wildcard action "*" in withAllowedActions',
    );
  });

  test("withAllowedActions throws error when wildcard action is mixed with other actions", () => {
    const app = new App();
    const stack = new DigitrafficStack(app, "test-stack", {
      alarmTopicArn: "",
      production: false,
      shortName: "test",
      stackProps: {},
      secretId: "testSecret",
      trafficType: TrafficType.ROAD,
      warningTopicArn: "",
    });

    expect(() => {
      FunctionBuilder.plain(stack, "test")
        .withCode(Code.fromInline("{}"))
        .withAllowedActions("s3:GetObject", "*", "dynamodb:Query")
        .build();
    }).toThrow(
      'Lambda test-Test cannot use wildcard action "*" in withAllowedActions',
    );
  });
});
