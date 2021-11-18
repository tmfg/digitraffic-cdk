import {Construct, Duration} from '@aws-cdk/core';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import {Canaries} from "./canaries";
import {AtonProps} from "./app-props";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficSqsQueue} from "digitraffic-common/queue/sqs";

export class AtonFaultsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: AtonProps) {
        super(scope, id, configuration);

        const s124Queue = DigitrafficSqsQueue.create(this, 'SendS124', {
            receiveMessageWaitTime: Duration.seconds(5),
            visibilityTimeout: Duration.seconds(60)
        });

        IntegrationApi.create(this, s124Queue);
        InternalLambdas.create(this, s124Queue);
        PublicApi.create(this);
        new Canaries(this);
    }
}
