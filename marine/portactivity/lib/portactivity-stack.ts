import { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas";
import * as IntegrationApi from "./integration-api";
import * as Sqs from "./sqs";
import { PublicApi } from "./public-api";
import { PortactivityConfiguration } from "./app-props";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import {
    DatabaseCluster,
    DatabaseClusterEngine,
    DatabaseProxy,
    ProxyTarget,
} from "aws-cdk-lib/aws-rds";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { Canaries } from "./canaries";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";

export class PortActivityStack extends DigitrafficStack {
    constructor(
        scope: Construct,
        id: string,
        config: PortactivityConfiguration
    ) {
        super(scope, id, config);

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

        new Bucket(this, "DocumentationBucket", {
            bucketName: config.documentationBucketName,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        });
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
            }
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
