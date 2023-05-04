import { Environment } from "aws-cdk-lib";

export interface MonitoringConfiguration {
    readonly warningTopicEmail: string;
    readonly alarmTopicEmail: string;

    readonly db?: DBConfiguration;
    readonly route53?: Route53Configuration;
    readonly cloudfront?: CloudfrontConfiguration;

    readonly env: Environment;
}

export interface DBConfiguration {
    readonly dbClusterIdentifier: string;
    readonly cpuLimit: number;
    readonly writeIOPSLimit: number;
    readonly readIOPSLimit: number;
    readonly volumeWriteIOPSLimit: number;
    readonly volumeReadIOPSLimit: number;
}

export interface Route53Configuration {
    readonly zoneIds: string[];
}

export interface CloudfrontConfiguration {
    readonly distributions: {
        readonly id: string;
        readonly threshold?: number;
    }[];
}
