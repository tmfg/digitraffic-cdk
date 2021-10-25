import {Environment} from "@aws-cdk/core";

export type MonitoringConfiguration = {
    readonly warningTopicEmail: string
    readonly alarmTopicEmail: string

    readonly db?: DBConfiguration;
    readonly mqtt?: MQTTConfiguration[];

    readonly env: Environment;
}

export type DBConfiguration = {
    readonly dbClusterIdentifier: string;
    readonly cpuLimit?: number;
    readonly writeIOPSLimit?: number;
    readonly readIOPSLimit?: number;
}

export type MQTTConfiguration = {
    readonly brokerName: string;
    readonly cpuLimit?: number;
    readonly heapLimit?: number;
    readonly networkLimit?: number;
}
