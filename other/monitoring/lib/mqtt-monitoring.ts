import {Topic} from "@aws-cdk/aws-sns";
import {MonitoringConfiguration, MQTTConfiguration} from "./app-props";
import {Stack} from "@aws-cdk/core";
import {Alarm, ComparisonOperator, Metric} from "@aws-cdk/aws-cloudwatch";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";

export class MqttMonitoring {
    private readonly stack: Stack;
    private readonly alarmsTopic: Topic;

    constructor(stack: Stack, alarmsTopic: Topic, configuration: MonitoringConfiguration) {
        this.stack = stack;
        this.alarmsTopic = alarmsTopic;

        configuration.mqtt?.forEach((mqtt: MQTTConfiguration) => {
            const cpuLimit = mqtt.cpuLimit ?? 60;
            const heapLimit = mqtt.heapLimit ?? 80;
            const networkLimit = mqtt.networkLimit ?? 50 * 1000*1000; // 50 MB

            this.createAlarmForMetric('MQTT-CPU-ALARM', mqtt.brokerName, 'CpuUtilization', cpuLimit);
            this.createAlarmForMetric('MQTT-Heap-ALARM', mqtt.brokerName, 'HeapUsage', heapLimit);
            this.createAlarmForMetric('MQTT-NetworkALARM', mqtt.brokerName, 'NetworkOut', networkLimit, ComparisonOperator.GREATER_THAN_THRESHOLD);
        });
    }

    createAlarmForMetric(alarmName: string, brokerName: string, metricName: string, threshold: number, comparisonOperator = ComparisonOperator.GREATER_THAN_THRESHOLD) {
        const metric = new Metric({
            namespace: 'AWS/AmazonMQ',
            metricName,
            dimensions: {
                Broker: brokerName
            }
        });

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
