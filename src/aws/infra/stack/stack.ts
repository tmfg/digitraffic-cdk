import { Aspects, Stack, type StackProps } from "aws-cdk-lib";
import { type ISecurityGroup, type IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { type ITopic, Topic } from "aws-cdk-lib/aws-sns";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { type ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";

import { StackCheckingAspect } from "./stack-checking-aspect.js";
import { Construct } from "constructs";
import { TrafficType } from "../../../types/traffictype.js";
import type { DBLambdaEnvironment } from "./lambda-configs.js";

const SSM_ROOT = "/digitraffic";
export const SOLUTION_KEY = "Solution";
const MONITORING_ROOT = "/monitoring";

export const SSM_KEY_WARNING_TOPIC = `${SSM_ROOT}${MONITORING_ROOT}/warning-topic`;
export const SSM_KEY_ALARM_TOPIC = `${SSM_ROOT}${MONITORING_ROOT}/alarm-topic`;

export interface StackConfiguration {
    readonly shortName: string;
    readonly secretId?: string;
    readonly alarmTopicArn: string;
    readonly warningTopicArn: string;
    readonly logsDestinationArn?: string;

    readonly vpcId?: string;
    readonly lambdaDbSgId?: string;
    readonly privateSubnetIds?: string[];
    readonly availabilityZones?: string[];

    readonly trafficType: TrafficType;
    readonly production: boolean;
    readonly stackProps: StackProps;

    readonly stackFeatures?: {
        readonly enableCanaries?: boolean;
        readonly enableDocumentation?: boolean;
    };

    /// whitelist resources for StackCheckingAspect
    readonly whitelistedResources?: string[];
}

export class DigitrafficStack extends Stack {
    readonly vpc?: IVpc;
    readonly lambdaDbSg?: ISecurityGroup;
    readonly alarmTopic: ITopic;
    readonly warningTopic: ITopic;
    readonly secret?: ISecret;

    readonly configuration: StackConfiguration;

    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration.stackProps);

        this.configuration = configuration;

        if (configuration.secretId) {
            this.secret = Secret.fromSecretNameV2(this, "Secret", configuration.secretId);
        }

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        if (configuration.vpcId) {
            this.vpc = Vpc.fromVpcAttributes(this, "vpc", {
                vpcId: configuration.vpcId,
                privateSubnetIds: configuration.privateSubnetIds,
                availabilityZones: configuration.availabilityZones ?? [],
            });
        }

        // security group that allows Lambda database access
        if (configuration.lambdaDbSgId) {
            this.lambdaDbSg = SecurityGroup.fromSecurityGroupId(
                this,
                "LambdaDbSG",
                configuration.lambdaDbSgId
            );
        }

        this.alarmTopic = Topic.fromTopicArn(
            this,
            "AlarmTopic",
            StringParameter.fromStringParameterName(this, "AlarmTopicParam", SSM_KEY_ALARM_TOPIC).stringValue
        );
        this.warningTopic = Topic.fromTopicArn(
            this,
            "WarningTopic",
            StringParameter.fromStringParameterName(this, "WarningTopicParam", SSM_KEY_WARNING_TOPIC)
                .stringValue
        );

        this.addAspects();
    }

    addAspects() {
        Aspects.of(this).add(
            new StackCheckingAspect(this.configuration.shortName, this.configuration.whitelistedResources)
        );
    }

    createLambdaEnvironment(): DBLambdaEnvironment {
        return this.createDefaultLambdaEnvironment(this.configuration.shortName);
    }

    createDefaultLambdaEnvironment(dbApplication: string): DBLambdaEnvironment {
        return this.configuration.secretId
            ? {
                  SECRET_ID: this.configuration.secretId,
                  DB_APPLICATION: dbApplication,
              }
            : {
                  DB_APPLICATION: dbApplication,
              };
    }

    getSecret(): ISecret {
        if (this.secret === undefined) {
            throw new Error("Secret is undefined");
        }
        return this.secret;
    }

    grantSecret(...lambdas: AWSFunction[]) {
        const secret = this.getSecret();
        lambdas.forEach((l: AWSFunction) => secret.grantRead(l));
    }
}
