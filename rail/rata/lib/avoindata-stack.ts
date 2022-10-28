import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { RataProps } from "./rata-props";

export class AvoinDataStack extends Stack {
    constructor(scope: Construct, id: string, props: RataProps) {
        super(scope, id, props);

        this.common(props);
        this.database(props);
        this.updater(props);
        this.server(props);
        this.graphQL(props);
    }

    private common(props: RataProps) {
        const ecsCluster: ecs.ICluster = ecs.Cluster.fromClusterArn(
            this,
            "ecsCluster",
            props.common.ecsClusterArn
        );
        new CfnOutput(this, "ecsClusterOutput", {
            value: ecsCluster.clusterName,
        });
    }

    private database(props: RataProps) {
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            "avoinDataRdsSecurityGroup",
            props.avoinData.database.securityGroupId
        );
        new CfnOutput(this, "avoinDataDbSecurityGroupIdOutput", {
            value: securityGroup.securityGroupId,
        });

        const databaseCluster: rds.IDatabaseCluster =
            rds.DatabaseCluster.fromDatabaseClusterAttributes(
                this,
                "avoinDataDBCluster",
                {
                    clusterIdentifier: props.avoinData.database.clusterId,
                }
            );
        new CfnOutput(this, "avoinDataDbClusterArnOutput", {
            value: databaseCluster.clusterIdentifier,
        });
    }

    private updater(props: RataProps) {
        const updaterEcrRepo = ecr.Repository.fromRepositoryName(
            this,
            "updaterEcrRepo",
            props.avoinData.updater.ecrRepo
        );
        new CfnOutput(this, "updaterEcrRepoArnOutput", {
            value: updaterEcrRepo.repositoryArn,
        });

        const updaterTaskDefinition = ecs.TaskDefinition.fromTaskDefinitionArn(
            this,
            "updaterTaskDefinition",
            props.avoinData.updater.taskDefinitionArn
        );
        new CfnOutput(this, "updaterTaskDefinitionOutput", {
            value: updaterTaskDefinition.taskDefinitionArn,
        });
    }

    private server(props: RataProps) {
        const serverEcrRepo = ecr.Repository.fromRepositoryName(
            this,
            "serverEcrRepo",
            props.avoinData.server.ecrRepo
        );
        new CfnOutput(this, "serverEcrRepoArnOutput", {
            value: serverEcrRepo.repositoryArn,
        });

        const serverTaskDefinition = ecs.TaskDefinition.fromTaskDefinitionArn(
            this,
            "serverTaskDefinition",
            props.avoinData.server.taskDefinitionArn
        );
        new CfnOutput(this, "serverTaskDefinitionOutput", {
            value: serverTaskDefinition.taskDefinitionArn,
        });
    }

    private graphQL(props: RataProps) {
        const graphQLEcrRepo = ecr.Repository.fromRepositoryName(
            this,
            "graphQlEcrRepo",
            props.avoinData.graphQL.ecrRepo
        );
        new CfnOutput(this, "graphqlEcrRepoOutput", {
            value: graphQLEcrRepo.repositoryName,
        });

        const ecsService: ecs.IFargateService =
            ecs.FargateService.fromFargateServiceArn(
                this,
                "graphqlService",
                props.avoinData.graphQL.serviceArn
            );
        new CfnOutput(this, "graphqlServiceOutput", {
            value: ecsService.serviceName,
        });

        const taskDefinition: ecs.ITaskDefinition =
            ecs.TaskDefinition.fromTaskDefinitionArn(
                this,
                "graphqlTaskDefinition",
                props.avoinData.graphQL.taskDefinitionArn
            );
        new CfnOutput(this, "graphqlTaskDefinitionOutput", {
            value: taskDefinition.taskDefinitionArn,
        });
    }
}
