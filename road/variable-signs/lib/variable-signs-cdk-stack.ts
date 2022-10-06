import {Construct} from 'constructs';
import {DigitrafficStack, StackConfiguration} from "@digitraffic/common/aws/infra/stack/stack";
import {IntegrationApi} from "./integration-api";
import {PublicApi} from "./public-api";
import {Canaries} from "./canaries";

export class VariableSignsCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        new IntegrationApi(this);
        const publicApi = new PublicApi(this);
        new Canaries(this, publicApi.restApi);
    }
}
