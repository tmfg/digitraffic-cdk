import {Topic} from "aws-cdk-lib/aws-sns";
import {MQTTConfiguration} from "./app-props";
import {Stack} from "aws-cdk-lib";
import {Alarm, ComparisonOperator, Metric} from "aws-cdk-lib/aws-cloudwatch";
import {SnsAction} from "aws-cdk-lib/aws-cloudwatch-actions";

export class MqttMonitoring {
    private readonly stack: Stack;
    private readonly alarmsTopic: Topic;

    constructor(stack: Stack, alarmsTopic: Topic, mqttConfigurations: MQTTConfiguration[]) {
        this.stack = stack;
        this.alarmsTopic = alarmsTopic;

        mqttConfigurations.forEach((mqtt: MQTTConfiguration) => {
            const cpuLimit = mqtt.cpuLimit ?? 60;
            const heapLimit = mqtt.heapLimit ?? 85;
            const networkLimit = mqtt.networkLimit ?? 50 * 1024*1024; // 50 MiB

            this.createAlarmForMetric('CPU', mqtt.brokerName, 'CpuUtilization', cpuLimit);
            this.createAlarmForMetric('Heap', mqtt.brokerName, 'HeapUsage', heapLimit);
            this.createAlarmForMetric('Network', mqtt.brokerName, 'NetworkOut', networkLimit);
        });
    }

    createAlarmForMetric(
        name: string, brokerName: string, metricName: string, threshold: number, comparisonOperator = ComparisonOperator.GREATER_THAN_THRESHOLD,
    ) {
        const metric = new Metric({
            namespace: 'AWS/AmazonMQ',
            metricName,
            dimensionsMap: {
                Broker: brokerName,
            },
        });

        const alarmName = `MQTT-${this.stack.stackName}-${brokerName}-${name}`;

        const alarm = new Alarm(this.stack, alarmName, {
            alarmName,
            metric,
            evaluationPeriods: 5,
            threshold,
            comparisonOperator,
            datapointsToAlarm: 2,
        });

        alarm.addAlarmAction(new SnsAction(this.alarmsTopic));
    }
}
