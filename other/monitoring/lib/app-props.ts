import {Environment} from "@aws-cdk/core";

export type MonitoringConfiguration = {
    readonly warningTopicEmail: string
    readonly alarmTopicEmail: string

    readonly db?: DBConfiguration;

    readonly env: Environment;
}

type DBConfiguration = {
    readonly dbClusterIdentifier: string;
    readonly cpuLimit?: number;
    readonly writeIOPSLimit?: number;
    readonly readIOPSLimit?: number;
}
