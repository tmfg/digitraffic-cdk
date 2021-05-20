import {LambdaConfiguration} from "../../../common/stack/lambda-configs";
import {Duration} from '@aws-cdk/core';

export interface MobileServerProps extends LambdaConfiguration {
    readonly secretId: string;
    readonly env: string;
    readonly updateFrequency: Duration;
}