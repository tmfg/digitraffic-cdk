import {Construct} from '@aws-cdk/core';
import * as InternalLambdas from './internal-lambdas';
import {ShiplightProps} from './app-props';
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class ShiplightStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: ShiplightProps) {
        super(scope, id, appProps);

        InternalLambdas.create(this);
    }
}
