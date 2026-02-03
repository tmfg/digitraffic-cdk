import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Duration } from "aws-cdk-lib";
import { AwsIntegration, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import type { IVpc } from "aws-cdk-lib/aws-ec2";
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DockerImageCode } from "aws-cdk-lib/aws-lambda";
import type { IBucket } from "aws-cdk-lib/aws-s3";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CfnOutput } from "aws-cdk-lib/core";
import { DockerImageName, ECRDeployment } from "cdk-ecr-deployment";
import type { DigitrafficStatisticsStack } from "./digitraffic-statistics-stack.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class StatisticsIntegrations {
  readonly apiStatisticsS3Integration: AwsIntegration;
  readonly digitrafficMonthlyLambdaIntegration: LambdaIntegration;

  constructor(stack: DigitrafficStatisticsStack) {
    const vpc = Vpc.fromLookup(stack, "OsKeyFiguresVPC", {
      vpcId: stack.statisticsProps.vpcId,
    });

    const digitrafficMonthlySg = new SecurityGroup(
      stack,
      "digitraffic-monthly-sg",
      {
        vpc,
        allowAllOutbound: true,
        securityGroupName: "digitraffic-monthly-sg",
      },
    );

    this.createDbAccessIngressRule(stack, digitrafficMonthlySg);

    const repository = new Repository(stack, "digitraffic-figures-repo");

    this.apiStatisticsS3Integration =
      this.createApiStatisticsS3Integration(stack);
    this.digitrafficMonthlyLambdaIntegration =
      this.createDigitrafficMonthlyLambdaIntegration(
        stack,
        vpc,
        digitrafficMonthlySg,
        repository,
      );
  }

  private createDbAccessIngressRule(
    stack: DigitrafficStatisticsStack,
    sg: SecurityGroup,
  ): void {
    const rdsEsKeyFiguresSg = SecurityGroup.fromLookupById(
      stack,
      "os-key-figures-sg",
      stack.statisticsProps.rdsSgId,
    );
    rdsEsKeyFiguresSg.addIngressRule(
      Peer.securityGroupId(sg.securityGroupId),
      Port.tcp(3306),
    );
  }

  private createDigitrafficMonthlyLambdaIntegration(
    stack: DigitrafficStatisticsStack,
    vpc: IVpc,
    sg: SecurityGroup,
    repository: Repository,
  ): LambdaIntegration {
    const image = new DockerImageAsset(stack, "FiguresImage", {
      assetName: "digitraffic-figures-image",
      directory: path.join(__dirname, "../digitraffic-figures/"),
    });

    const imageUrl = `${repository.repositoryUri}:latest`;

    const ecrDeployment = new ECRDeployment(stack, "FiguresECRDeployment", {
      src: new DockerImageName(image.imageUri),
      dest: new DockerImageName(imageUrl),
    });

    // create image url output
    new CfnOutput(stack, "ImageUrl", { value: imageUrl });

    ecrDeployment.node.addDependency(image);

    const code = DockerImageCode.fromEcr(repository, {
      tagOrDigest: "latest",
    });

    const digitrafficMonthlyFunction = new lambda.DockerImageFunction(
      stack,
      "digitraffic-monthly",
      {
        functionName: "digitraffic-monthly",
        code,
        vpc,
        securityGroups: [sg],
        role: this.createDigitrafficMonthlyLambdaRole(stack),
        architecture: lambda.Architecture.ARM_64,
        memorySize: 4096,
        timeout: Duration.seconds(60),
        environment: stack.statisticsProps.figuresLambdaEnv,
      },
    );

    digitrafficMonthlyFunction.node.addDependency(ecrDeployment);

    return new LambdaIntegration(digitrafficMonthlyFunction, {
      proxy: true,
    });
  }

  private createApiStatisticsS3Integration(
    stack: DigitrafficStatisticsStack,
  ): AwsIntegration {
    const apiStatisticsBucket = Bucket.fromBucketArn(
      stack,
      "api-statistics-bucket",
      stack.statisticsProps.visualizationsBucketArn,
    );
    return new AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${apiStatisticsBucket.bucketName}/{key}`,
      options: {
        credentialsRole: this.createS3ExecutionRole(stack, apiStatisticsBucket),
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "'text/html'",
            },
          },
        ],
        requestParameters: {
          "integration.request.path.key": "method.request.path.key",
        },
      },
    });
  }

  private createS3ExecutionRole(
    stack: DigitrafficStatisticsStack,
    bucket: IBucket,
  ): iam.Role {
    const executeRole = new iam.Role(
      stack,
      "digitraffic-api-statistics-apigw-s3-integration-role",
      {
        assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        roleName: "digitraffic-api-statistics-apigw-s3-integration-role",
      },
    );
    executeRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`${bucket.bucketArn}/*.html`],
        actions: ["s3:GetObject"],
      }),
    );
    return executeRole;
  }

  private createDigitrafficMonthlyLambdaRole(
    stack: DigitrafficStatisticsStack,
  ): iam.Role {
    const lambdaRole = new iam.Role(stack, "digitraffic-monthly-lambda-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "digitraffic-monthly-lambda-role",
    });
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ec2:CreateNetworkInterface",
          "logs:CreateLogStream",
          "ec2:DescribeNetworkInterfaces",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "ec2:DeleteNetworkInterface",
          "logs:CreateLogGroup",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      }),
    );
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [stack.statisticsProps.dbSecretArn],
      }),
    );
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        resources: ["*"],
      }),
    );
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "CloudWatchLambdaInsightsExecutionRolePolicy",
      ),
    );

    return lambdaRole;
  }
}
