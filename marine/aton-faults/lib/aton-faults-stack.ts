import {Duration} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficSqsQueue} from "digitraffic-common/aws/infra/sqs-queue";
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import {Canaries} from "./canaries";
import {AtonProps} from "./app-props";

export class AtonFaultsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: AtonProps) {
        super(scope, id, configuration);

        const s124Queue = DigitrafficSqsQueue.create(this, 'SendS124', {
            receiveMessageWaitTime: Duration.seconds(5),
            visibilityTimeout: Duration.seconds(60),
        });

        IntegrationApi.create(this, s124Queue);
        InternalLambdas.create(this, s124Queue);
        const publicApi = PublicApi.create(this);
        new Canaries(this, publicApi);
    }
}
