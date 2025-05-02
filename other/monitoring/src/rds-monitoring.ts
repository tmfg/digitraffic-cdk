import type { DBConfiguration, DBLimits } from "./app-props.js";
import type { Stack } from "aws-cdk-lib";
import {
  CfnEventSubscription,
  DatabaseCluster,
  DatabaseClusterEngine,
  type IDatabaseCluster,
} from "aws-cdk-lib/aws-rds";
import type { Topic } from "aws-cdk-lib/aws-sns";
import { ComparisonOperator, type Metric } from "aws-cdk-lib/aws-cloudwatch";
import { createAlarm } from "./alarms.js";

export class RdsMonitoring {
  private readonly stack: Stack;
  private readonly alarmsTopic: Topic;

  constructor(
    stack: Stack,
    alarmsTopic: Topic,
    dbConfiguration: DBConfiguration,
  ) {
    this.stack = stack;
    this.alarmsTopic = alarmsTopic;

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
          this.createLimits(cluster, c.limits);
        }
      });
    }

    if (dbConfiguration.instances) {
      // nothing for instances yet
    }

    this.createEventSubscriptions();
  }

  createLimits(cluster: IDatabaseCluster, limits: DBLimits): void {
    const cpuLimit = limits.cpuLimit;
    const freeMemoryLimit = 200 * 1024 * 1024; // 200 * MiB
    const writeIOPSLimit = limits.writeIOPSLimit;
    const readIOPSLimit = limits.readIOPSLimit;
    const volumeWriteIOPSLimit = limits.volumeWriteIOPSLimit;
    const volumeReadIOPSLimit = limits.volumeReadIOPSLimit;

    const identifier = cluster.clusterIdentifier;

    this.createAlarm(
      identifier,
      "CPU",
      cluster.metricCPUUtilization(),
      cpuLimit,
    );
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
      writeIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "ReadIOPS",
      cluster.metric("ReadIOPS"),
      readIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "VolumeWriteIOPS",
      cluster.metricVolumeWriteIOPs(),
      volumeWriteIOPSLimit,
    );
    this.createAlarm(
      identifier,
      "VolumeReadIOPS",
      cluster.metricVolumeReadIOPs(),
      volumeReadIOPSLimit,
    );
    this.createAlarm(identifier, "Deadlocks", cluster.metricDeadlocks());
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
    identifier: string,
    name: string,
    metric: Metric,
    threshold: number = 1,
    comparisonOperator: ComparisonOperator =
      ComparisonOperator.GREATER_THAN_THRESHOLD,
  ): void {
    const alarmName = `DB-${identifier}-${name}`;

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
