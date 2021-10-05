import {Construct} from '@aws-cdk/core';
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from './public-api';
import {Props} from './app-props'
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class BridgeLockDisruptionsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: Props) {
        super(scope, id, appProps);

        const secret = Secret.fromSecretNameV2(this, 'MarineSecret', appProps.secretId);

        InternalLambdas.create(secret, this);
        PublicApi.create(secret, this);
    }
}
