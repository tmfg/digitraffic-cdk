import {Construct} from '@aws-cdk/core';
import {Secret} from "@aws-cdk/aws-secretsmanager";
import * as IntegrationApi from './integration-api';
import {AppProps} from './app-props'
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class SseStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: AppProps) {
        super(scope, id, appProps);

        const secret = Secret.fromSecretNameV2(this, 'SseSecret', appProps.secretId);

        IntegrationApi.createIntegrationApiAndHandlerLambda(secret, this);
    }
}
