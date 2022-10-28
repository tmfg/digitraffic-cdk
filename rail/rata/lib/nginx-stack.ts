import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { RataProps } from "./rata-props";

export class NginxStack extends Stack {
    constructor(scope: Construct, id: string, props: RataProps) {
        super(scope, id, props);

        const nginxEcrRepo = ecr.Repository.fromRepositoryName(
            this,
            "nginxEcrRepo",
            props.nginx.ecrRepo
        );
        new CfnOutput(this, "nginxEcrRepoOutput", {
            value: nginxEcrRepo.repositoryArn,
        });

        const ecsService = ecs.FargateService.fromFargateServiceArn(
            this,
            "nginxFargateService",
            props.nginx.serviceArn
        );
        new CfnOutput(this, "nginxEcsServiceOutput", {
            value: ecsService.serviceName,
        });

        const ecsTaskDefinition = ecs.TaskDefinition.fromTaskDefinitionArn(
            this,
            "nginxTaskDefinition",
            props.nginx.taskDefinitionArn
        );
        new CfnOutput(this, "nginxEcsTaskDefinitionOutput", {
            value: ecsTaskDefinition.taskDefinitionArn,
        });
    }
}
