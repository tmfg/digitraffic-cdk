import {Construct, StackProps} from '@aws-cdk/core';
import {Vpc} from '@aws-cdk/aws-ec2';
import * as IntegrationApi from './integration-api';
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from './public-api';
import {VoyagePlanGatewayProps} from "./app-props";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {Topic} from "@aws-cdk/aws-sns";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class VoyagePlanGatewayStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: VoyagePlanGatewayProps) {
        super(scope, id, appProps);

        const secret = Secret.fromSecretNameV2(this, 'VPGWSecret', appProps.secretId);

        const notifyTopicName = 'VPGW-NotifyTopic';
        const notifyTopic = new Topic(this, notifyTopicName, {
            topicName: notifyTopicName,
            displayName: notifyTopicName
        });

        IntegrationApi.create(secret, notifyTopic, appProps, this);
        InternalLambdas.create(secret, notifyTopic, appProps, this);
        PublicApi.create(secret, appProps, this);
    }
}
