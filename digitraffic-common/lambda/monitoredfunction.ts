import {Function, FunctionProps} from '@aws-cdk/aws-lambda';
import {Stack} from "@aws-cdk/core";
import {ITopic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {ComparisonOperator} from "@aws-cdk/aws-cloudwatch";
import {TrafficType} from '../model/traffictype';

export enum MonitoredFunctionAlarm {
    DURATION,
    ERRORS,
    THROTTLES,
    DURATION_WARNING
}

export type MonitoredFunctionProps = {
    /**
     *  Use to create alarms only for certain metrics
     */
    readonly includeAlarms?: MonitoredFunctionAlarm[]
}

/**
 * Creates a Lambda function that monitors default CloudWatch Lambda metrics with CloudWatch Alarms.
 */
export class MonitoredFunction extends Function {

    /**
     * @param scope Stack
     * @param id Lambda construct Id
     * @param functionProps Lambda function properties
     * @param alarmSnsTopic SNS topic for alarms
     * @param warningSnsTopic SNS topic for warnings
     * @param trafficType Traffic type, used for alarm names. Set to null if Lambda is not related to any traffic type.
     * @param props Monitored function properties
     */
    constructor(
        scope: Stack,
        id: string,
        functionProps: FunctionProps,
        alarmSnsTopic: ITopic,
        warningSnsTopic: ITopic,
        trafficType: TrafficType | null,
        props?: MonitoredFunctionProps) {

        super(scope, id, functionProps);

        const alarmSnsAction = new SnsAction(alarmSnsTopic);
        const warningSnsAction = new SnsAction(warningSnsTopic);

        if (!functionProps.timeout) {
            throw new Error('Timeout needs to be explicitly set');
        }
        if (!props || props.includeAlarms?.includes(MonitoredFunctionAlarm.DURATION)) {
            this.metricDuration().createAlarm(scope, `${this.node.id}-Duration`, {
                alarmName: `${trafficType ?? ''} ${scope.stackName} ${this.functionName} duration alarm`.trim(),
                alarmDescription: `${this.functionName} duration has exceeded ${functionProps.timeout!.toSeconds()} seconds`,
                threshold: functionProps.timeout!.toMilliseconds(),
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                statistic: 'max',
                comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            }).addAlarmAction(alarmSnsAction);
        }
        if (!props || props.includeAlarms?.includes(MonitoredFunctionAlarm.DURATION_WARNING)) {
            this.metricDuration().createAlarm(scope, `${this.node.id}-Duration-Warning`, {
                alarmName: `${trafficType ?? ''} ${scope.stackName} ${this.functionName} duration warning`.trim(),
                alarmDescription: `${this.functionName} duration is 85 % of max ${functionProps.timeout!.toSeconds()} seconds`,
                threshold: functionProps.timeout!.toMilliseconds() * 0.85,
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                statistic: 'max',
                comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            }).addAlarmAction(warningSnsAction);
        }

        if (!props || props.includeAlarms?.includes(MonitoredFunctionAlarm.ERRORS)) {
            this.metricErrors().createAlarm(scope, `${this.node.id}-Errors`, {
                alarmName: `${trafficType ?? ''} ${scope.stackName} ${this.functionName} errors alarm`.trim(),
                alarmDescription: `${this.functionName} invocations did not succeed`,
                threshold: 1,
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                statistic: 'sum',
                comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            }).addAlarmAction(alarmSnsAction);
        }

        if (!props || props.includeAlarms?.includes(MonitoredFunctionAlarm.THROTTLES)) {
            this.metricThrottles().createAlarm(scope, `${this.node.id}-Throttles`, {
                alarmName: `${trafficType ?? ''} ${scope.stackName} ${this.functionName} throttles alarm`.trim(),
                alarmDescription: `${this.functionName} has throttled`,
                threshold: 0,
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                statistic: 'sum',
                comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
            }).addAlarmAction(alarmSnsAction);
        }
    }

}
