import { grantOACRights } from "@digitraffic/common/dist/aws/infra/bucket-policy";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import { AccountPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { BlockPublicAccess, Bucket, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";
import type { RoadnetworkProps } from "./app-props.js";

/** Prefixes the Road Network team publishes into. Everything outside these is site assets. */
const DATA_PREFIXES = ["latest", "releases", "digiroad"] as const;

/**
 * Distribution of the Road Network dataset releases.
 *
 * Owns the bucket the Road Network team publishes into and the listing page shown at
 * tie(-test).digitraffic.fi/roadnetwork/. The CloudFront behaviour that routes that path here
 * lives in `digitraffic-ci-internal/aws/cdk/other/cloudfront/cloudfront-road.ts`.
 */
export class RoadnetworkStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: RoadnetworkProps) {
    super(scope, id, configuration);

    const bucket = this.createBucket(configuration);

    this.grantCloudfrontRead(bucket, configuration);
    this.grantPublisherWrite(bucket, configuration);
    this.deployWebsite(bucket);
  }

  private createBucket(configuration: RoadnetworkProps): Bucket {
    return new Bucket(this, "RoadnetworkBucket", {
      bucketName: configuration.bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      // Access is managed through bucket policies; ACLs are intentionally disabled.
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      // Publishers have delete rights, so versioning provides a two week undo window. Releases
      // happen about twice a year, so noncurrent versions exist only briefly after a publish.
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: Duration.days(14),
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
    });
  }

  private grantCloudfrontRead(
    bucket: Bucket,
    configuration: RoadnetworkProps,
  ): void {
    grantOACRights({
      bucket,
      distributionArn: configuration.cloudfrontDistributionArn,
    });

    // The listing page reads the bucket contents through ListObjectsV2 on the bucket root.
    grantOACRights({
      bucket,
      distributionArn: configuration.cloudfrontDistributionArn,
      actions: ["s3:ListBucket"],
      resources: [bucket.bucketArn],
    });
  }

  private grantPublisherWrite(
    bucket: Bucket,
    configuration: RoadnetworkProps,
  ): void {
    const { roadnetworkAccountId, ssoPermissionSetName } = configuration;

    // Principal cannot contain a wildcard, so the SSO role is matched with a condition instead.
    const ssoRoleCondition = {
      ArnLike: {
        "aws:PrincipalArn": `arn:aws:iam::${roadnetworkAccountId}:role/aws-reserved/sso.amazonaws.com/*/AWSReservedSSO_${ssoPermissionSetName}_*`,
      },
    };

    bucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "RoadnetworkPublisherObjectAccess",
        effect: Effect.ALLOW,
        principals: [new AccountPrincipal(roadnetworkAccountId)],
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          // Datasets are over 5 GB, so uploads always go through multipart.
          "s3:AbortMultipartUpload",
          "s3:ListMultipartUploadParts",
        ],
        resources: DATA_PREFIXES.map(
          (prefix) => `${bucket.bucketArn}/${prefix}/*`,
        ),
        conditions: ssoRoleCondition,
      }),
    );

    bucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "RoadnetworkPublisherBucketAccess",
        effect: Effect.ALLOW,
        principals: [new AccountPrincipal(roadnetworkAccountId)],
        actions: ["s3:ListBucket", "s3:GetBucketLocation"],
        resources: [bucket.bucketArn],
        conditions: ssoRoleCondition,
      }),
    );
  }

  private deployWebsite(bucket: Bucket): void {
    const dataPrefixPlaceholders = DATA_PREFIXES.map((prefix) =>
      Source.data(`${prefix}/.keep`, ""),
    );

    new BucketDeployment(this, "RoadnetworkWebsite", {
      destinationBucket: bucket,
      sources: [
        Source.asset("./src/website"),
        // S3 has no directories, so keep placeholder objects to make the data structure visible
        // before the first real dataset upload.
        ...dataPrefixPlaceholders,
      ],
      // Datasets live in the same bucket and must survive a website deployment.
      prune: false,
    });
  }
}
