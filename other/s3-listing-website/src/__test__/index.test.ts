import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment } from "aws-cdk-lib/aws-s3-deployment";
import { describe, expect, test } from "vitest";
import { createListingWebsiteSources } from "../index.js";

const ENGINE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "engine",
);

describe("createListingWebsiteSources", () => {
  test("returns exactly two sources: the shared engine and the generated config", () => {
    const sources = createListingWebsiteSources({
      basePath: "/tmc/",
      messages: {
        fi: { title: "Testi", intro: "Testiaineistot." },
        en: { title: "Test", intro: "Test datasets." },
      },
    });

    expect(sources).toHaveLength(2);
  });

  test("the engine directory contains the expected static files", () => {
    for (const relativePath of [
      "index.html",
      "assets/app.js",
      "assets/styles.css",
      "assets/fintraffic-logo.svg",
      "assets/favicon.ico",
      "assets/favicon-32x32.png",
      "assets/favicon-16x16.png",
      "assets/apple-touch-icon.png",
    ]) {
      expect(existsSync(path.join(ENGINE_DIR, relativePath))).toBe(true);
    }
    // config.js is generated per site by createListingWebsiteSources, never checked in here.
    expect(existsSync(path.join(ENGINE_DIR, "assets/config.js"))).toBe(false);
  });

  // Bundling the CDK-internal deployment handler asset can be slow on cold/loaded CI runners.
  test("synthesizes cleanly as BucketDeployment sources", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack", {
      env: { account: "123456789012", region: "eu-west-1" },
    });
    const bucket = new Bucket(stack, "TestBucket");

    new BucketDeployment(stack, "TestWebsite", {
      destinationBucket: bucket,
      sources: createListingWebsiteSources({
        basePath: "/tmc/",
        hiddenKeys: ["list.html"],
        messages: {
          fi: { title: "Testi", intro: "Testiaineistot." },
          en: { title: "Test", intro: "Test datasets." },
        },
        mockListing: {
          "": { folders: ["certified/"], files: [] },
        },
      }),
      prune: false,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("Custom::CDKBucketDeployment", 1);
  }, 20000);

  // Bundling the CDK-internal deployment handler asset can be slow on cold/loaded CI runners.
  test("excludes mockListing from the generated config.js", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack", {
      env: { account: "123456789012", region: "eu-west-1" },
    });
    const bucket = new Bucket(stack, "TestBucket");

    new BucketDeployment(stack, "TestWebsite", {
      destinationBucket: bucket,
      sources: createListingWebsiteSources({
        basePath: "/tmc/",
        messages: {
          fi: { title: "Testi", intro: "Testiaineistot." },
          en: { title: "Test", intro: "Test datasets." },
        },
        mockListing: {
          "": { folders: ["certified/"], files: [] },
        },
      }),
      prune: false,
    });

    app.synth();

    const configFile = readdirSync(app.outdir, { recursive: true })
      .map((entry) => path.join(app.outdir, entry.toString()))
      .find(
        (filePath) =>
          filePath.endsWith("config.js") &&
          readFileSync(filePath, "utf8").includes("LISTING_CONFIG"),
      );

    expect(configFile).toBeDefined();
    expect(readFileSync(configFile as string, "utf8")).not.toContain(
      "mockListing",
    );
  }, 20000);
});
