import { CfnOutput, Stack } from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { RataProps } from "./rata-props.js";

export class TrainHistoryStack extends Stack {
  constructor(scope: Construct, id: string, props: RataProps) {
    super(scope, id, props);

    this.database(props);
    this.ecrRepos(props);
  }

  private ecrRepos(props: RataProps): void {
    const trainHistoryWebRepo = ecr.Repository.fromRepositoryName(
      this,
      "trainHistoryWebRepo",
      props.trainHistory.web.ecrRepo,
    );
    new CfnOutput(this, "trainHistoryWebRepoArnOutput", {
      value: trainHistoryWebRepo.repositoryArn,
    });

    const trainHistoryBackendRepo = ecr.Repository.fromRepositoryName(
      this,
      "trainHistoryBackendRepo",
      props.trainHistory.backend.ecrRepo,
    );
    new CfnOutput(this, "trainHistoryBackendRepoArnOutput", {
      value: trainHistoryBackendRepo.repositoryArn,
    });

    const trainHistoryUpdaterRepo = ecr.Repository.fromRepositoryName(
      this,
      "trainHistoryUpdaterRepo",
      props.trainHistory.updater.ecrRepo,
    );
    new CfnOutput(this, "trainHistoryUpdaterRepoArnOutput", {
      value: trainHistoryUpdaterRepo.repositoryArn,
    });
  }

  private database(props: RataProps): void {
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "trainHistoryDbSecurityGroup",
      props.trainHistory.database.securityGroupId,
    );
    new CfnOutput(this, "trainHistoryDbSecurityGroupIdOutput", {
      value: securityGroup.securityGroupId,
    });

    const databaseCluster: rds.IDatabaseCluster = rds.DatabaseCluster
      .fromDatabaseClusterAttributes(
        this,
        "trainHistoryDatabaseCluster",
        {
          clusterIdentifier: props.trainHistory.database.clusterId,
        },
      );
    new CfnOutput(this, "trainHistoryDatabaseClusterArnOutput", {
      value: databaseCluster.clusterIdentifier,
    });
  }
}
