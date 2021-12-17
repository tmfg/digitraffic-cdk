import {Construct} from 'constructs';
import * as IntegrationApi from "./integration-api";
import * as PublicApi from "./public-api";
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";

export class VariableSignsCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        IntegrationApi.create(this);
        PublicApi.create(this);
    }
}
