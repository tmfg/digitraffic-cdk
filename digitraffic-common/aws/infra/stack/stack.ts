import {Aspects, Stack, StackProps} from "aws-cdk-lib";
import {IVpc, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {ISecurityGroup} from "aws-cdk-lib/aws-ec2/lib/security-group";
import {ITopic, Topic} from "aws-cdk-lib/aws-sns";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {ISecret, Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Function} from "aws-cdk-lib/aws-lambda";

import {StackCheckingAspect} from "./stack-checking-aspect";
import {Construct} from "constructs";
import {TrafficType} from "../../../types/traffictype";
import {DBLambdaEnvironment} from "./lambda-configs";

const SSM_ROOT = '/digitraffic';
export const SOLUTION_KEY = 'Solution';
const MONITORING_ROOT = '/monitoring';

export const SSM_KEY_WARNING_TOPIC = `${SSM_ROOT}${MONITORING_ROOT}/warning-topic`;
export const SSM_KEY_ALARM_TOPIC = `${SSM_ROOT}${MONITORING_ROOT}/alarm-topic`;

export type StackConfiguration = {
    readonly shortName?: string;
    readonly secretId?: string;
    readonly alarmTopicArn: string;
    readonly warningTopicArn: string;
    readonly enableCanaries: boolean;
    readonly logsDestinationArn?: string;

    readonly vpcId?: string;
    readonly lambdaDbSgId?: string;
    readonly privateSubnetIds?: string[];
    readonly availabilityZones?: string[];

    readonly trafficType: TrafficType;
    readonly production: boolean;
    readonly stackProps: StackProps;

    readonly whitelistedResources?: string[];
}

export class DigitrafficStack extends Stack {
    readonly vpc: IVpc;
    readonly lambdaDbSg: ISecurityGroup;
    readonly alarmTopic: ITopic;
    readonly warningTopic: ITopic;
    readonly secret: ISecret;

    readonly configuration: StackConfiguration;

    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration.stackProps);

        this.configuration = configuration;

        if (configuration.secretId) {
            this.secret = Secret.fromSecretNameV2(this, 'Secret', configuration.secretId);
        }

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        if (configuration.vpcId) {
            this.vpc = Vpc.fromVpcAttributes(this, 'vpc', {
                vpcId: configuration.vpcId,
                privateSubnetIds: configuration.privateSubnetIds,
                availabilityZones: configuration.availabilityZones as string[],
            });
        }

        // security group that allows Lambda database access
        if (configuration.lambdaDbSgId) {
            this.lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', configuration.lambdaDbSgId);
        }

        this.alarmTopic = Topic.fromTopicArn(this,
            'AlarmTopic',
            StringParameter.fromStringParameterName(this, 'AlarmTopicParam', SSM_KEY_ALARM_TOPIC).stringValue);
        this.warningTopic = Topic.fromTopicArn(this, 'WarningTopic',
            StringParameter.fromStringParameterName(this, 'WarningTopicParam', SSM_KEY_WARNING_TOPIC).stringValue);

        this.addAspects();
    }

    addAspects() {
        Aspects.of(this).add(StackCheckingAspect.create(this));
    }

    createLambdaEnvironment(): DBLambdaEnvironment {
        return this.createDefaultLambdaEnvironment(this.configuration.shortName as string);
    }

    createDefaultLambdaEnvironment(dbApplication: string): DBLambdaEnvironment {
        return this.configuration.secretId ? {
            SECRET_ID: this.configuration.secretId,
            DB_APPLICATION: dbApplication,
        } : {
            DB_APPLICATION: dbApplication,
        };
    }

    grantSecret(...lambdas: Function[]) {
        lambdas.forEach((l: Function) => this.secret.grantRead(l));
    }
}
