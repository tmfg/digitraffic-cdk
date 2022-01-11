import {Construct} from "constructs";
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from './public-api';
import {Props} from './app-props';
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";

export class BridgeLockDisruptionsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: Props) {
        super(scope, id, appProps);

        InternalLambdas.create(this.secret, this);
        PublicApi.create(this.secret, this);
    }
}
