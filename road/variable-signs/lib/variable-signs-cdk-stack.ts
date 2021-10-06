import {Construct} from '@aws-cdk/core';
import * as IntegrationApi from "./integration-api";
import * as PublicApi from "./public-api";
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";
import {Secret} from "@aws-cdk/aws-secretsmanager";

export class VariableSignsCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        const secret = Secret.fromSecretNameV2(this, 'VSSecret', configuration.secretId);

        IntegrationApi.create(this, secret);
        PublicApi.create(this, secret);
    }
}
