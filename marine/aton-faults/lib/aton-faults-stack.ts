import {Construct} from '@aws-cdk/core';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {Canaries} from "./canaries";

export class AtonFaultsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: AtonProps) {
        super(scope, id, configuration);

        const sendFaultTopicName = 'ATON-SendFaultTopic';
        const sendFaultTopic = new Topic(this, sendFaultTopicName, {
            topicName: sendFaultTopicName,
            displayName: sendFaultTopicName
        });

        IntegrationApi.create(this, sendFaultTopic);
        InternalLambdas.create(this, sendFaultTopic);
        PublicApi.create(this);
        new Canaries(this);
    }
}
