import {Construct} from '@aws-cdk/core';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "../../../digitraffic-common/stack/stack";
import {Canaries} from "./canaries";

export class AtonFaultsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: AtonProps) {
        super(scope, id, configuration);

        const secret = Secret.fromSecretNameV2(this, 'AtonSecret', configuration.secretId);

        const sendFaultTopicName = 'ATON-SendFaultTopic';
        const sendFaultTopic = new Topic(this, sendFaultTopicName, {
            topicName: sendFaultTopicName,
            displayName: sendFaultTopicName
        });

        IntegrationApi.create(this, secret, sendFaultTopic);
        InternalLambdas.create(this, secret, sendFaultTopic);
        PublicApi.create(this, secret);
        new Canaries(this, secret);
    }
}
