import type { Environment } from "aws-cdk-lib";
import type { IClusterEngine } from "aws-cdk-lib/aws-rds";

export interface MonitoringConfiguration {
  readonly warningTopicEmail: string;
  readonly alarmTopicEmail: string;

  readonly ecs?: EcsConfiguration;
  readonly db?: DBConfiguration;
  readonly route53?: Route53Configuration;
  readonly cloudfront?: CloudfrontConfiguration;

  readonly env: Environment;
}

export interface EcsConfiguration {
  readonly services: EcsService[];
}

export interface EcsService {
    readonly clusterName: string;
    readonly serviceName: string;
    readonly cpu?: number | "DISABLED";
    readonly memory?: number | "DISABLED";
}

export interface DBConfiguration {
  readonly dbClusterIdentifier: string;
  readonly engine?: IClusterEngine;
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
    /** used only for reporting */
    readonly name: string;
  }[];
}
