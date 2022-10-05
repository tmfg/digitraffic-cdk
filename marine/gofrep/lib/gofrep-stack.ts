import {Construct} from 'constructs';
import * as IntegrationApi from './integration-api';
import {GofrepProps} from "./app-props";
import {DigitrafficStack} from "@digitraffic/common/aws/infra/stack/stack";

export class GofrepStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: GofrepProps) {
        super(scope, id, appProps);

        IntegrationApi.create(this);
    }
}
