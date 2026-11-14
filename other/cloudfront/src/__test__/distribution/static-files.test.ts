import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { afterAll, beforeAll, expect, test } from "vitest";
import { WafRules } from "../../acl/waf-rules.js";
import { CloudfrontCdkStack } from "../../cloudfront-cdk-stack.js";
import { Behavior } from "../../distribution/behavior.js";
import { DistributionBuilder } from "../../distribution/distribution-builder.js";
import {
  listStaticFiles,
  staticSiteDirs,
} from "../../distribution/static-files.js";

const LOG_CONFIG_ARN =
  "arn:aws:cloudfront::123456789012:realtime-log-config/test";

// the real static content is not in this repository, so the tests use their own
let staticRootDir: string;

beforeAll(() => {
  staticRootDir = mkdtempSync(join(tmpdir(), "cloudfront-static-"));
  mkdirSync(join(staticRootDir, "common"));
  mkdirSync(join(staticRootDir, "afir"));
  writeFileSync(join(staticRootDir, "common", "robots.txt"), "common robots");
  writeFileSync(join(staticRootDir, "common", "llms.txt"), "common llms");
  writeFileSync(join(staticRootDir, "afir", "llms.txt"), "afir llms");
  // biome-ignore lint/complexity/useLiteralKeys: Comes from indexed property
  process.env["CLOUDFRONT_STATIC_ROOT"] = staticRootDir;
});

afterAll(() => {
  // biome-ignore lint/complexity/useLiteralKeys: Comes from indexed property
  delete process.env["CLOUDFRONT_STATIC_ROOT"];
  rmSync(staticRootDir, { recursive: true, force: true });
});

function createStack(
  build: (stack: CloudfrontCdkStack) => void,
): CloudfrontCdkStack {
  const app = new App();
  const stack = new CloudfrontCdkStack(app, "TestStack", {
    env: { account: "123456789012", region: "us-east-1" },
  }).withLogConfig(LOG_CONFIG_ARN);

  build(stack);

  return stack;
}

function addDistributionWithStaticFiles(
  stack: CloudfrontCdkStack,
  name: string,
): void {
  stack.withDistribution(name, undefined, (builder) =>
    builder
      .withAliasName(`${name}.digitraffic.fi`)
      .withAclRule(WafRules.per5min(200, 100))
      .withStaticFiles("afir")
      .withBehaviors(Behavior.nginxPlain("*", "origin.example.com")),
  );
}

test("listStaticFiles returns common files for a site without own directory", () => {
  const files = listStaticFiles("no-such-site");

  expect(files).toContain("robots.txt");
});

test("listStaticFiles merges common and site files without duplicates", () => {
  const commonOnly = listStaticFiles("no-such-site");
  const afir = listStaticFiles("afir");

  // merged union contains all common files, is sorted and has no duplicates
  for (const file of commonOnly) {
    expect(afir).toContain(file);
  }
  expect(afir).toEqual([...afir].sort());
  expect(new Set(afir).size).toBe(afir.length);
});

test("staticSiteDirs lists common before site so site files override", () => {
  const dirs = staticSiteDirs("afir");

  expect(dirs).toHaveLength(2);
  expect(dirs[0]).toBe(join(staticRootDir, "common"));
  expect(dirs[1]).toBe(join(staticRootDir, "afir"));
});

test("withStaticFiles throws when called twice", () => {
  const builder = new DistributionBuilder(
    undefined as unknown as CloudfrontCdkStack,
    "Test",
  ).withStaticFiles("afir");

  expect(() => builder.withStaticFiles("afir")).toThrow(
    "Static files already configured",
  );
});

test("withStaticFiles rejects invalid site names", () => {
  const builder = new DistributionBuilder(
    undefined as unknown as CloudfrontCdkStack,
    "Test",
  );

  expect(() => builder.withStaticFiles("..")).toThrow(
    "Invalid static site name",
  );
});

test("withStaticFiles creates bucket, deployment and exact-path behaviors", () => {
  const stack = createStack((s) => addDistributionWithStaticFiles(s, "test"));
  const template = Template.fromStack(stack);

  // one private static files bucket per environment
  template.resourceCountIs("AWS::S3::Bucket", 1);
  template.hasResourceProperties("AWS::S3::Bucket", {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });

  // content deployed under the site prefix as plain text, invalidating served paths
  template.hasResourceProperties("Custom::CDKBucketDeployment", {
    DestinationBucketKeyPrefix: "afir/",
    SystemMetadata: { "content-type": "text/plain; charset=utf-8" },
    DistributionPaths: listStaticFiles("afir").map((file) => `/${file}*`),
  });

  // exact-path behavior per static file, served from the /afir origin path
  const distributions = template.findResources("AWS::CloudFront::Distribution");
  const distribution = Object.values(distributions)[0] as {
    Properties: {
      DistributionConfig: {
        CacheBehaviors: { PathPattern: string; TargetOriginId: string }[];
        Origins: {
          Id: string;
          OriginPath?: string;
          OriginAccessControlId?: unknown;
        }[];
      };
    };
  };
  const config = distribution.Properties.DistributionConfig;

  const robotsBehavior = config.CacheBehaviors.find(
    (b) => b.PathPattern === "robots.txt",
  );
  expect(robotsBehavior).toBeDefined();

  const staticOrigin = config.Origins.find(
    (o) => o.Id === robotsBehavior?.TargetOriginId,
  );
  expect(staticOrigin?.OriginPath).toBe("/afir");
  expect(staticOrigin?.OriginAccessControlId).toBeDefined();
});

test("two distributions can share the static files bucket", () => {
  const stack = createStack((s) => {
    addDistributionWithStaticFiles(s, "first");
    addDistributionWithStaticFiles(s, "second");
  });
  const template = Template.fromStack(stack);

  // still only one bucket, with both distributions using it
  template.resourceCountIs("AWS::S3::Bucket", 1);
  template.resourceCountIs("AWS::CloudFront::Distribution", 2);
});
