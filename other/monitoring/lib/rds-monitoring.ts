import {MonitoringConfiguration} from "./app-props";
import {Stack} from "@aws-cdk/core";
import {DatabaseCluster, DatabaseClusterEngine} from "@aws-cdk/aws-rds";
import {Topic} from "@aws-cdk/aws-sns";
import {Alarm, ComparisonOperator, Metric} from "@aws-cdk/aws-cloudwatch";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";

export class RdsMonitoring {
    private readonly stack: Stack;
    private readonly alarmsTopic: Topic;

    constructor(stack: Stack, alarmsTopic: Topic, configuration: MonitoringConfiguration) {
        this.stack = stack;
        this.alarmsTopic = alarmsTopic;

        if(configuration.db) {
            const cluster = DatabaseCluster.fromDatabaseClusterAttributes(stack, 'DbCluster', {
                clusterIdentifier: configuration.db.dbClusterIdentifier,
                engine: DatabaseClusterEngine.AURORA_POSTGRESQL
            });

            const cpuLimit = configuration.db.cpuLimit || 60;
            const writeIOPSLimit = configuration.db.writeIOPSLimit || 1000;
            const readIOPSLimit = configuration.db.readIOPSLimit || 100;
            const freeMemoryLimit = 100 * 1024*1024; // 100 * MB

            this.createAlarm('DB-CPU-ALARM', cluster.metricCPUUtilization(), cpuLimit);
            this.createAlarm('DB-WriteIOPS-ALARM', cluster.metric('WriteIOPS'), writeIOPSLimit);
            this.createAlarm('DB-ReadIOPS-ALARM', cluster.metric('ReadIOPS'), readIOPSLimit);
            this.createAlarm('DB-Deadlocks-ALARM', cluster.metricDeadlocks());
            this.createAlarm('DB-FreeMemory-ALARM', cluster.metricFreeableMemory(), freeMemoryLimit, ComparisonOperator.LESS_THAN_THRESHOLD);
        }
    }

    createAlarm(alarmName: string, metric: Metric, threshold = 1, comparisonOperator = ComparisonOperator.GREATER_THAN_THRESHOLD) {
        const alarm = new Alarm(this.stack, alarmName, {
            alarmName,
            metric,
            evaluationPeriods: 5,
            threshold,
            comparisonOperator,
        });

        alarm.addAlarmAction(new SnsAction(this.alarmsTopic));
    }

}