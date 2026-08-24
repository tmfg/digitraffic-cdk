import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, test } from "vitest";
import type { RoadnetworkProps } from "../app-props.js";
import { RoadnetworkStack } from "../roadnetwork-stack.js";

// Placeholder values - no real infrastructure identifiers.
const ROADNETWORK_ACCOUNT = "210987654321";
const DISTRIBUTION_ARN =
  "arn:aws:cloudfront::123456789012:distribution/E1EXAMPLE";
const SSO_PERMISSION_SET = "PlaceholderPublisherPermissionSet";

const CONFIG: RoadnetworkProps = {
  shortName: "RoadNetwork",
  bucketName: "roadnetwork-test",
  cloudfrontDistributionArn: DISTRIBUTION_ARN,
  ssoPermissionSetName: SSO_PERMISSION_SET,
  roadnetworkAccountId: ROADNETWORK_ACCOUNT,
  alarmTopicArn: "arn:aws:sns:eu-west-1:123456789012:alarm-topic",
  warningTopicArn: "arn:aws:sns:eu-west-1:123456789012:warning-topic",
  trafficType: TrafficType.ROAD,
  production: false,
  stackProps: {
    env: { account: "123456789012", region: "eu-west-1" },
  },
  whitelistedResources: ["CDKBucketDeployment"],
};

function createTemplate(): Template {
  const app = new App();
  const stack = new RoadnetworkStack(app, "RoadnetworkTest", CONFIG);
  return Template.fromStack(stack);
}

interface PolicyStatement {
  readonly Sid?: string;
  readonly Action: string | string[];
  readonly Resource: string | string[];
  readonly Condition?: { readonly ArnLike?: { "aws:PrincipalArn": string } };
}

interface BucketPolicyResource {
  readonly Properties: {
    readonly PolicyDocument: { readonly Statement: PolicyStatement[] };
  };
}

function bucketPolicyStatements(): PolicyStatement[] {
  const policies = createTemplate().findResources("AWS::S3::BucketPolicy");
  return Object.values(policies).flatMap(
    (policy) =>
      (policy as unknown as BucketPolicyResource).Properties.PolicyDocument
        .Statement,
  );
}

function findStatement(sid: string): PolicyStatement {
  const statement = bucketPolicyStatements().find(
    (candidate) => candidate.Sid === sid,
  );
  expect(statement).toBeDefined();
  return statement as PolicyStatement;
}

describe("Roadnetwork bucket", () => {
  test("blocks public access and enables versioning", () => {
    createTemplate().hasResourceProperties("AWS::S3::Bucket", {
      BucketName: "roadnetwork-test",
      VersioningConfiguration: { Status: "Enabled" },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      OwnershipControls: {
        Rules: [{ ObjectOwnership: "BucketOwnerEnforced" }],
      },
    });
  });

  test("expires noncurrent versions after two weeks", () => {
    createTemplate().hasResourceProperties("AWS::S3::Bucket", {
      LifecycleConfiguration: {
        Rules: [
          Match.objectLike({
            NoncurrentVersionExpiration: { NoncurrentDays: 14 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
            Status: "Enabled",
          }),
        ],
      },
    });
  });
});

describe("Roadnetwork bucket policy", () => {
  test("grants CloudFront read and list access", () => {
    const actions = bucketPolicyStatements()
      .filter((statement) => statement.Sid === undefined)
      .flatMap((statement) => [statement.Action].flat());

    expect(actions).toContain("s3:GetObject");
    expect(actions).toContain("s3:ListBucket");
  });

  test("grants publisher object access only to the data prefixes", () => {
    const statement = findStatement("RoadnetworkPublisherObjectAccess");

    expect(statement.Action).toEqual([
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts",
    ]);
    expect(statement.Resource).toHaveLength(3);
  });

  test("restricts publisher access to the SSO permission set role", () => {
    for (const sid of [
      "RoadnetworkPublisherObjectAccess",
      "RoadnetworkPublisherBucketAccess",
    ]) {
      const statement = findStatement(sid);

      expect(statement.Condition?.ArnLike?.["aws:PrincipalArn"]).toBe(
        `arn:aws:iam::${ROADNETWORK_ACCOUNT}:role/aws-reserved/sso.amazonaws.com/*/AWSReservedSSO_${SSO_PERMISSION_SET}_*`,
      );
    }
  });
});

describe("Roadnetwork website", () => {
  test("does not prune the datasets on deployment", () => {
    createTemplate().hasResourceProperties("Custom::CDKBucketDeployment", {
      Prune: false,
    });
  });
});
