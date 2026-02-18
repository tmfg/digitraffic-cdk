import {
  grantOACRights,
  grantOAIRights,
} from "@digitraffic/common/dist/aws/infra/bucket-policy";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseProxy,
  ProxyTarget,
} from "aws-cdk-lib/aws-rds";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import type { PortactivityConfiguration } from "./app-props.js";
import { Canaries } from "./canaries-stack.js";
import * as IntegrationApi from "./integration-api.js";
import * as InternalLambdas from "./internal-lambdas-stack.js";
import { PublicApi } from "./public-api.js";
import * as Sqs from "./sqs.js";

export class PortActivityStack extends DigitrafficStack {
  readonly portActivityConfig: PortactivityConfiguration;

  constructor(scope: Construct, id: string, config: PortactivityConfiguration) {
    super(scope, id, config);
    this.portActivityConfig = config;

    if (!this.secret) {
      throw new Error("Secret is required!");
    }

    this.createRdsProxy(this.secret, config.dbClusterIdentifier);

    const queueAndDLQ = Sqs.createQueue(this);
    const dlqBucket = new Bucket(this, "DLQBucket", {
      bucketName: config.dlqBucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    InternalLambdas.create(this, queueAndDLQ, dlqBucket);
    IntegrationApi.create(queueAndDLQ.queue, this);

    const publicApi = new PublicApi(this);

    new Canaries(this, queueAndDLQ.dlq, publicApi, this.secret);

    const swaggerBucket = new Bucket(this, "DocumentationBucket", {
      bucketName: config.documentationBucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    grantOACRights({
      bucket: swaggerBucket,
      distributionArn: config.cloudfrontArn,
    });

    if (config.cloudfrontCanonicalId) {
      grantOAIRights({
        bucket: swaggerBucket,
        canonicalUserId: config.cloudfrontCanonicalId,
      });
    }
  }

  createRdsProxy(secret: ISecret, clusterIdentifier: string): void {
    if (!this.vpc || !this.lambdaDbSg) {
      throw new Error("vpc and lambdaDbSg required!");
    }

    const cluster = DatabaseCluster.fromDatabaseClusterAttributes(
      this,
      "DbCluster",
      {
        clusterIdentifier,
        engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
      },
    );

    // CDK tries to allow connections between proxy and cluster
    // this does not work on cluster references
    cluster.connections.allowDefaultPortFrom = () => {
      /* nothing */
    };

    const dbProxyName = "PortActivityRDSProxy";
    new DatabaseProxy(this, dbProxyName, {
      dbProxyName,
      vpc: this.vpc,
      secrets: [secret],
      proxyTarget: ProxyTarget.fromCluster(cluster),
      securityGroups: [this.lambdaDbSg],
      requireTLS: false,
    });
  }
}
