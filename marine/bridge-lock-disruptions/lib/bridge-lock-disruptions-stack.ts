import {Construct} from "constructs";
import * as InternalLambdas from './internal-lambdas';
import {Props} from './app-props';
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {PublicApi} from "./public-api";

export class BridgeLockDisruptionsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: Props) {
        super(scope, id, appProps);

        InternalLambdas.create(this);
        new PublicApi(this);
    }
}
