import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, test } from "vitest";
import type { TmcProps } from "../app-props.js";
import { TmcStack } from "../tmc-stack.js";

// Placeholder values - no real infrastructure identifiers.
const DISTRIBUTION_ARN =
  "arn:aws:cloudfront::123456789012:distribution/E1EXAMPLE";
const BASE_CONFIG: TmcProps = {
  shortName: "Tmc",
  bucketName: "tmc-road-test",
  cloudfrontDistributionArn: DISTRIBUTION_ARN,
  alarmTopicArn: "arn:aws:sns:eu-west-1:123456789012:alarm-topic",
  warningTopicArn: "arn:aws:sns:eu-west-1:123456789012:warning-topic",
  trafficType: TrafficType.ROAD,
  production: false,
  stackProps: {
    env: { account: "123456789012", region: "eu-west-1" },
  },
  whitelistedResources: ["CDKBucketDeployment"],
};

function createTemplate(configOverrides: Partial<TmcProps> = {}): Template {
  const app = new App();
  const stack = new TmcStack(app, "TmcTest", {
    ...BASE_CONFIG,
    ...configOverrides,
  });
  return Template.fromStack(stack);
}

interface PolicyStatement {
  readonly Sid?: string;
  readonly Action: string | string[];
  readonly Resource: string | string[];
  readonly Condition?: {
    readonly StringEquals?: Record<string, string>;
  };
}

function bucketPolicyStatements(template: Template): PolicyStatement[] {
  const policies = template.findResources("AWS::S3::BucketPolicy");
  return Object.values(policies).flatMap(
    (policy) =>
      (
        policy as unknown as {
          Properties: { PolicyDocument: { Statement: PolicyStatement[] } };
        }
      ).Properties.PolicyDocument.Statement,
  );
}

function findStatement(template: Template, sid: string): PolicyStatement {
  const statement = bucketPolicyStatements(template).find(
    (candidate) => candidate.Sid === sid,
  );
  expect(statement).toBeDefined();
  return statement as PolicyStatement;
}

describe("Tmc bucket", () => {
  test("never creates a bucket; only the existing one is referenced", () => {
    // This stack must import the existing tmc-road-<env> bucket, never create one.
    createTemplate().resourceCountIs("AWS::S3::Bucket", 0);
  });

  test("deploys the website without pruning existing dataset objects", () => {
    createTemplate().hasResourceProperties("Custom::CDKBucketDeployment", {
      Prune: false,
    });
  });
});

describe("Tmc bucket policy", () => {
  test("grants CloudFront read and list access scoped to the distribution", () => {
    const template = createTemplate();

    const getObject = findStatement(template, "CloudfrontGetObject");
    expect(getObject.Action).toEqual("s3:GetObject");
    expect(getObject.Condition?.StringEquals?.["aws:sourceArn"]).toEqual(
      DISTRIBUTION_ARN,
    );

    const listBucket = findStatement(template, "CloudfrontListBucket");
    expect(listBucket.Action).toEqual("s3:ListBucket");
    expect(listBucket.Condition?.StringEquals?.["aws:sourceArn"]).toEqual(
      DISTRIBUTION_ARN,
    );
  });

  test("has exactly the two expected statements, nothing broader", () => {
    const template = createTemplate();
    const bucketArn = "arn:aws:s3:::tmc-road-test";

    expect(bucketPolicyStatements(template)).toHaveLength(2);
    expect(findStatement(template, "CloudfrontGetObject").Resource).toEqual(
      `${bucketArn}/*`,
    );
    expect(findStatement(template, "CloudfrontListBucket").Resource).toEqual(
      bucketArn,
    );
  });
});
