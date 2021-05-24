import {Construct, Stack, StackProps} from '@aws-cdk/core';
import * as PublicApi from './public-api';
import {GofrepProps} from "./app-props";

export class GofrepStack extends Stack {
    constructor(scope: Construct, id: string, appProps: GofrepProps, props?: StackProps) {
        super(scope, id, props);

        PublicApi.create(this);
    }
}
