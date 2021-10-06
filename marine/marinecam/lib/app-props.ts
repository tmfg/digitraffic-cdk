import {Duration} from '@aws-cdk/core';
import {StackConfiguration} from "digitraffic-common/stack/stack";

export interface MobileServerProps extends StackConfiguration {
    readonly env: string;
    readonly updateFrequency: Duration;
}
