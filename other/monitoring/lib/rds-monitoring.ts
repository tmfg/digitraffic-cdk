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

            const cpuLimit = configuration.db.cpuLimit;
            const writeIOPSLimit = configuration.db.writeIOPSLimit;
            const readIOPSLimit = configuration.db.readIOPSLimit;
            const freeMemoryLimit = 200 * 1024*1024; // 200 * MiB

            this.createAlarm('CPU', cluster.metricCPUUtilization(), cpuLimit);
            this.createAlarm('WriteIOPS', cluster.metric('WriteIOPS'), writeIOPSLimit);
            this.createAlarm('ReadIOPS', cluster.metric('ReadIOPS'), readIOPSLimit);
            this.createAlarm('FreeMemory', cluster.metricFreeableMemory(), freeMemoryLimit, ComparisonOperator.LESS_THAN_THRESHOLD);
            this.createAlarm('Deadlocks', cluster.metricDeadlocks());
        }
    }

    createAlarm(name: string, metric: Metric, threshold = 1, comparisonOperator = ComparisonOperator.GREATER_THAN_THRESHOLD) {
        const alarmName = `DB-${this.stack.stackName}-${name}`;

        const alarm = new Alarm(this.stack, alarmName, {
            alarmName,
            metric,
            evaluationPeriods: 5,
            threshold,
            comparisonOperator,
            datapointsToAlarm: 2
        });

        alarm.addAlarmAction(new SnsAction(this.alarmsTopic));
    }
}