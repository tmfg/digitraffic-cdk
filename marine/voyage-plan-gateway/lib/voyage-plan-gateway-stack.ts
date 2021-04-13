import {Stack, Construct, StackProps} from '@aws-cdk/core';
import * as IntegrationApi from './integration-api';
import {VoyagePlanGatewayProps} from "./app-props";
import {Secret} from "@aws-cdk/aws-secretsmanager";

export class VoyagePlanGatewayStack extends Stack {
    constructor(scope: Construct, id: string, appProps: VoyagePlanGatewayProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'VPGWSecret', appProps.secretId);

        IntegrationApi.create(secret, appProps, this);
    }
}
