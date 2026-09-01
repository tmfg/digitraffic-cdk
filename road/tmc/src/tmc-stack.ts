import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createListingWebsiteSources } from "@digitraffic-cdk/s3-listing-website";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import type { IBucket } from "aws-cdk-lib/aws-s3";
import { Bucket, CfnBucketPolicy } from "aws-cdk-lib/aws-s3";
import { BucketDeployment } from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";
import type { TmcProps } from "./app-props.js";

/**
 * Distribution of the TMC/ALERT-C location table dataset, at tie(-test).digitraffic.fi/tmc/.
 *
 * This stack imports the existing `tmc-road-<env>` bucket; it does not create it. The bucket
 * (and its data: LICENSE.txt, the zip packages, and the `certified/`/`noncertified/` prefixes)
 * predates this stack and is still managed by CloudFormation
 * (`digitraffic-ci-internal/aws/cloudformation/digitraffic-cloudformation.yml`). That template
 * keeps `DeletionPolicy: Retain` on the bucket, so removing it from the template only ends
 * CloudFormation's management of it; the objects themselves survive. The bucket policy, however,
 * is managed unconditionally by this stack (see `applyBucketPolicy` below).
 * The CloudFront behaviour that routes `/tmc/*` here lives in
 * `digitraffic-ci-internal/aws/cdk/other/cloudfront/cloudfront-road.ts`, alongside the
 * `/roadnetwork/*` behaviour that serves the same style of listing page.
 */
export class TmcStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: TmcProps) {
    super(scope, id, configuration);

    const bucket = Bucket.fromBucketAttributes(this, "TmcBucket", {
      bucketName: configuration.bucketName,
    });

    this.deployWebsite(bucket);

    // bucket.addToResourcePolicy on an imported bucket is a silent no-op, hence the explicit
    // CfnBucketPolicy below.
    this.applyBucketPolicy(bucket, configuration);
  }

  /**
   * Grants the public CloudFront distribution object read and bucket listing access.
   */
  private applyBucketPolicy(bucket: IBucket, configuration: TmcProps): void {
    const bucketArn = `arn:aws:s3:::${configuration.bucketName}`;

    const policyDocument = new PolicyDocument({
      statements: [
        new PolicyStatement({
          sid: "CloudfrontGetObject",
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
          actions: ["s3:GetObject"],
          resources: [`${bucketArn}/*`],
          conditions: {
            StringEquals: {
              "aws:sourceArn": configuration.cloudfrontDistributionArn,
            },
          },
        }),
        new PolicyStatement({
          sid: "CloudfrontListBucket",
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
          actions: ["s3:ListBucket"],
          resources: [bucketArn],
          conditions: {
            StringEquals: {
              "aws:sourceArn": configuration.cloudfrontDistributionArn,
            },
          },
        }),
      ],
    });

    new CfnBucketPolicy(this, "TmcBucketPolicy", {
      bucket: bucket.bucketName,
      policyDocument: policyDocument.toJSON(),
    });
  }

  private deployWebsite(bucket: IBucket): void {
    new BucketDeployment(this, "TmcWebsite", {
      destinationBucket: bucket,
      sources: createListingWebsiteSources({
        basePath: "/tmc/",
        messages: {
          fi: {
            title: "TMC/ALERT-C-sijaintitietokanta",
            intro:
              "Ladattavat TMC/ALERT-C-sijaintitietokannan aineistot. certified/-kansio sisältää sertifioidut aineistoversiot ja noncertified/-kansio sertifioimattomat aineistoversiot. Juurihakemistossa on lisäksi lisenssi- ja tapahtumalistatiedostoja.",
          },
          en: {
            title: "TMC/ALERT-C location table",
            intro:
              "Downloadable TMC/ALERT-C location table datasets. The certified/ folder contains certified dataset releases and the noncertified/ folder contains non-certified dataset releases. The root folder also has licence and event list files.",
          },
        },
      }),
      // The bucket also holds TMC datasets (LICENSE.txt, the zip packages, certified/ and
      // noncertified/) that this deployment must never touch or remove: keep prune false and
      // the source scoped to only the website's own files.
      prune: false,
    });
  }
}
