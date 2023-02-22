import { Environment } from "aws-cdk-lib";

export interface MonitoringConfiguration {
    readonly warningTopicEmail: string;
    readonly alarmTopicEmail: string;

    readonly db?: DBConfiguration;
    readonly mqtt?: MQTTConfiguration[];
    readonly route53?: Route53Configuration;

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

export interface MQTTConfiguration {
    readonly brokerName: string;
    readonly cpuLimit?: number;
    readonly heapLimit?: number;
    readonly networkLimit?: number;
}

export interface Route53Configuration {
    readonly routeIds: string[];
}
