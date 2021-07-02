import {Stack} from '@aws-cdk/core';

export enum AppType {
    ROAD = 'road', MARINE = 'marine', UNKNOWN = 'unknown'
}

export enum EnvType {
    PROD = 'prod', TEST = 'test', UNKNOWN = 'unknown'
}

export function getAppType(stack: Stack): AppType {
    if (stack.stackName.toLowerCase().includes('marine')) {
        return AppType.MARINE;
    }
    return AppType.ROAD;
}

export function getEnvType(stack: Stack): EnvType {
    if (stack.stackName.toLowerCase().includes('test')) {
        return EnvType.TEST;
    } else if (stack.stackName.toLowerCase().includes('prod')) {
        return EnvType.PROD;
    }
    return EnvType.UNKNOWN;
}

export function getFullEnv(stack: Stack): string {
    return getAppType(stack).toString() + '-' + getEnvType(stack);
}
