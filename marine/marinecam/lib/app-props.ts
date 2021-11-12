import {Duration} from '@aws-cdk/core';
import {StackConfiguration} from "digitraffic-common/stack/stack";

export type MobileServerProps = StackConfiguration & {
    readonly updateFrequency: Duration;
}
