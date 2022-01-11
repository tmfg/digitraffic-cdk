import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {Props} from './app-props';
import * as InternalLambdas from './internal-lambdas';
import * as HealthCheckProxyApi from './healthcheck-proxy-api';
import {Topic} from "aws-cdk-lib/aws-sns";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {SSM_KEY_ALARM_TOPIC, SSM_KEY_WARNING_TOPIC} from "digitraffic-common/aws/infra/stack/stack";

export class StatusStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const alarmTopic = Topic.fromTopicArn(this,
            'AlarmTopic',
            StringParameter.fromStringParameterName(this, 'AlarmTopicParam', SSM_KEY_ALARM_TOPIC).stringValue);
        const warningTopic = Topic.fromTopicArn(this, 'WarningTopic',
            StringParameter.fromStringParameterName(this, 'WarningTopicParam', SSM_KEY_WARNING_TOPIC).stringValue);

        InternalLambdas.create(this, alarmTopic, warningTopic, appProps);
        HealthCheckProxyApi.create(this, alarmTopic, warningTopic, appProps);
    }
}
