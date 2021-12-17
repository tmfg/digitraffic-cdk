import {Construct} from 'constructs';
import * as IntegrationApi from './integration-api';
import {AppProps} from './app-props';
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class SseStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: AppProps) {
        super(scope, id, appProps);

        IntegrationApi.createIntegrationApiAndHandlerLambda(this.secret, this);
    }
}
