import type { Stack } from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import type { EcsConfiguration } from "./app-props.js";
import type { Topic } from "aws-cdk-lib/aws-sns";
import { Metric } from "aws-cdk-lib/aws-cloudwatch";
import { createAlarm } from "./alarms.js";

export const DEFAULTS = {
  CPU: 80,
  MEMORY: 80,
} as const;

export class EcsMonitoring {
  private readonly stack: Stack;
  private readonly alarmsTopic: Topic;

  constructor(
    stack: Stack,
    alarmsTopic: Topic,
    ecsConfiguration: EcsConfiguration,
  ) {
    this.stack = stack;
    this.alarmsTopic = alarmsTopic;

    this.createAlarms(ecsConfiguration);
  }

  createAlarms(configuration: EcsConfiguration): void {
    configuration.services.forEach((service) => {
      if (service.cpu !== "DISABLED") {
        const cpuMetric = new Metric({
          metricName: "CPUUtilization",
          namespace: "AWS/ECS",
          dimensionsMap: {
            ServiceName: service.serviceName,
            ClusterName: service.clusterName,
          },
          statistic: "avg",
          period: Duration.minutes(5),
        });

        const cpuAlarmName = `ECS-${this.stack.stackName}-CPU-${service.serviceName}`;

        createAlarm(
          this.stack,
          this.alarmsTopic,
          cpuAlarmName,
          cpuMetric,
          service.cpu ?? DEFAULTS.CPU,
        );
      }

      if (service.memory !== "DISABLED") {
        const memoryMetric = new Metric({
          metricName: "MemoryUtilization",
          namespace: "AWS/ECS",
          dimensionsMap: {
            ServiceName: service.serviceName,
            ClusterName: service.clusterName,
          },
          statistic: "avg",
          period: Duration.minutes(5),
        });

        const memoryAlarmName = `ECS-${this.stack.stackName}-Memory-${service.serviceName}`;

        createAlarm(
          this.stack,
          this.alarmsTopic,
          memoryAlarmName,
          memoryMetric,
          service.memory ?? DEFAULTS.MEMORY,
        );
      }
    });
  }
}
