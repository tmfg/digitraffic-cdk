import {Function, FunctionProps} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {ITopic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";

export class MonitoredFunction extends Function {

    constructor(
        scope: Construct,
        id: string,
        props: FunctionProps,
        alarmSnsTopic: ITopic) {

        super(scope, id, props);

        if (!props.timeout) {
            throw new Error('Timeout needs to be explicitly set');
        }
        this.metricDuration().createAlarm(scope, `${this.node.id}-Duration`, {
            alarmName: `${this.functionName} duration alarm`,
            alarmDescription: `${this.functionName} duration has exceeded ${props.timeout!.toSeconds()} seconds`,
            threshold: props.timeout!.toMilliseconds(),
            evaluationPeriods: 1,
            datapointsToAlarm: 1
        }).addAlarmAction(new SnsAction(alarmSnsTopic));

        this.metricErrors().createAlarm(scope, `${this.node.id}-Errors`, {
            alarmName: `${this.functionName} errors alarm`,
            alarmDescription: `${this.functionName} invocations did not succeed`,
            threshold: 1,
            evaluationPeriods: 1,
            datapointsToAlarm: 1
        }).addAlarmAction(new SnsAction(alarmSnsTopic));

        if (!props.reservedConcurrentExecutions) {
            throw new Error('Reserved concurrent executions needs to be explicitly set');
        }
        this.metricThrottles().createAlarm(scope, `${this.node.id}-Throttles`, {
            alarmName: `${this.functionName} throttles alarm`,
            alarmDescription: `${this.functionName} has throttled`,
            threshold: props.reservedConcurrentExecutions!,
            evaluationPeriods: 1,
            datapointsToAlarm: 1
        }).addAlarmAction(new SnsAction(alarmSnsTopic));
    }

}
