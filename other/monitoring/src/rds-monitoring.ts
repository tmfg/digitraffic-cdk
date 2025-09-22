import type { DBConfiguration, DBLimits, InstanceLimits } from "./app-props.js";
import type { Stack } from "aws-cdk-lib";
import {
  CfnEventSubscription,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseInstance,
  type IDatabaseCluster,
  type IDatabaseInstance,
} from "aws-cdk-lib/aws-rds";
import type { Topic } from "aws-cdk-lib/aws-sns";
import { ComparisonOperator, type Metric } from "aws-cdk-lib/aws-cloudwatch";
import { createAlarm } from "./alarms.js";

export class RdsMonitoring {
  private readonly stack: Stack;
  private readonly alarmsTopic: Topic;

  private readonly envName: string;

  constructor(
    stack: Stack,
    alarmsTopic: Topic,
    envName: string,
    dbConfiguration: DBConfiguration,
  ) {
    this.stack = stack;
    this.alarmsTopic = alarmsTopic;
    this.envName = envName;

    if (dbConfiguration.clusters) {
      dbConfiguration.clusters.forEach((c) => {
        const cluster = DatabaseCluster.fromDatabaseClusterAttributes(
          stack,
          `DbCluster-${c.dbClusterIdentifier}`,
          {
            clusterIdentifier: c.dbClusterIdentifier,
            engine: c.engine ??
              DatabaseClusterEngine.AURORA_POSTGRESQL,
          },
        );

        if (c.limits) {
          const identifier = c.clusterName ?? c.dbClusterIdentifier;
          this.createLimitsForCluster(identifier, cluster, c.limits);
        }
      });
    }

    if (dbConfiguration.instances) {
      dbConfiguration.instances.forEach((i) => {
        const instance = DatabaseInstance.fromLookup(
          stack,
          `DbInstance-${i.instanceIdentifier}`,
          {
            instanceIdentifier: i.instanceIdentifier,
          },
        );

        if (i.limits) {
          const identifier = i.instanceName ?? instance.instanceIdentifier;
          this.createLimitsForInstance(identifier, instance, i.limits);
        }
      });
    }

    this.createEventSubscriptions();
  }

  createLimitsForInstance(
    identifier: string,
    instance: IDatabaseInstance,
    limits: InstanceLimits,
  ): void {
    if (limits.cpuMax) {
      this.createAlarm(
        identifier,
        "CPU",
        instance.metricCPUUtilization(),
        limits.cpuMax,
      );
    }
    this.createAlarm(
      identifier,
      "FreeStorage",
      instance.metricFreeStorageSpace(),
      limits.freeStorageMin,
      ComparisonOperator.LESS_THAN_THRESHOLD,
    );

    if (limits.cpuCreditBalanceMin) {
      this.createAlarm(
        identifier,
        "CpuCredit",
        instance.metric("CPUCreditBalance"),
        limits.cpuCreditBalanceMin,
        ComparisonOperator.LESS_THAN_THRESHOLD,
      );
    }
  }

  createLimitsForCluster(
    identifier: string,
    cluster: IDatabaseCluster,
    limits: DBLimits,
  ): void {
    const freeMemoryLimit = 200 * 1024 * 1024; // 200 * MiB
    const deadLocksMax = 1;

    this.createAlarm(
      identifier,
      "FreeLocalStorage",
      cluster.metricFreeLocalStorage(),
      limits.freeStorageMin,
      ComparisonOperator.LESS_THAN_THRESHOLD,
    );
    if (limits.cpuMax) {
      this.createAlarm(
        identifier,
        "CPU",
        cluster.metricCPUUtilization(),
        limits.cpuMax,
      );
    }
    this.createAlarm(
      identifier,
      "FreeMemory",
      cluster.metricFreeableMemory(),
      freeMemoryLimit,
      ComparisonOperator.LESS_THAN_THRESHOLD,
    );
    this.createAlarm(
      identifier,
      "WriteIOPS",
      cluster.metric("WriteIOPS"),
      limits.writeIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "ReadIOPS",
      cluster.metric("ReadIOPS"),
      limits.readIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "VolumeWriteIOPS",
      cluster.metricVolumeWriteIOPs(),
      limits.volumeWriteIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "VolumeReadIOPS",
      cluster.metricVolumeReadIOPs(),
      limits.volumeReadIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "Deadlocks",
      cluster.metricDeadlocks(),
      deadLocksMax,
    );

    if (limits.cpuCreditBalanceMin) {
      this.createAlarm(
        identifier,
        "CpuCredit",
        cluster.metric("CPUCreditBalance"),
        limits.cpuCreditBalanceMin,
        ComparisonOperator.LESS_THAN_THRESHOLD,
      );
    }

    if (limits.replicaLagMax) {
      this.createAlarm(
        identifier,
        "ReplicaLag",
        cluster.metric("AuroraReplicaLag"),
        limits.replicaLagMax,
      );
    }

    if (limits.dmlLatencyMax) {
      this.createAlarm(
        identifier,
        "DMLLatency",
        cluster.metric("DMLLatency"),
        limits.dmlLatencyMax,
      );
    }
  }

  createEventSubscriptions(): void {
    this.createEventSubscription("db-instance", [
      "availability",
      "configuration change",
      "read replica",
      "maintenance",
      "failure",
      "deletion",
      "security patching",
      "low storage",
    ]);
    this.createEventSubscription("db-cluster");
    this.createEventSubscription("db-parameter-group");
    this.createEventSubscription("db-security-group");
  }

  createEventSubscription(
    sourceType: string,
    eventCategories: string[] = [],
  ): CfnEventSubscription {
    const subscriptionName =
      `Subscription-${this.stack.stackName}-${sourceType}`;
    return new CfnEventSubscription(this.stack, subscriptionName, {
      snsTopicArn: this.alarmsTopic.topicArn,
      eventCategories,
      sourceType,
    });
  }

  createAlarm(
    dbIdentifier: string,
    name: string,
    metric: Metric,
    threshold: number,
    comparisonOperator: ComparisonOperator =
      ComparisonOperator.GREATER_THAN_THRESHOLD,
  ): void {
    const alarmName = `${this.envName} DB-${dbIdentifier}-${name}`;

    createAlarm(
      this.stack,
      this.alarmsTopic,
      alarmName,
      metric,
      threshold,
      comparisonOperator,
    );
  }
}
