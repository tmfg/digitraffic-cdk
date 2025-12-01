import type { Environment } from "aws-cdk-lib";
import type { IClusterEngine } from "aws-cdk-lib/aws-rds";

export interface MonitoringConfiguration {
  readonly warningTopicEmail: string;
  readonly alarmTopicEmail: string;
  readonly envName: string;

  readonly ecs?: EcsConfiguration;
  readonly db?: DBConfiguration;
  readonly route53?: Route53Configuration;
  readonly cloudfront?: CloudfrontConfiguration;

  readonly env: Environment & { accountName: string };
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

export interface DBLimits {
  readonly cpuMax?: number;
  readonly writeIOPSLimit: number;
  readonly readIOPSLimit: number;
  readonly volumeWriteIOPSLimit: number;
  readonly volumeReadIOPSLimit: number;
  readonly freeStorageMin: number;

  readonly cpuCreditBalanceMin?: number;
  readonly replicaLagMax?: number;
  readonly dmlLatencyMax?: number;
}

export type InstanceLimits = Pick<
  DBLimits,
  "cpuMax" | "freeStorageMin" | "cpuCreditBalanceMin"
>;

export interface DBConfiguration {
  readonly clusters?: {
    readonly dbClusterIdentifier: string;
    /// override cluster name in alarm
    readonly clusterName?: string;
    readonly engine?: IClusterEngine;

    readonly limits?: DBLimits;
  }[];

  readonly instances?: {
    readonly instanceIdentifier: string;
    /// override instance name in alarm
    readonly instanceName?: string;

    readonly limits?: InstanceLimits;
  }[];
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
