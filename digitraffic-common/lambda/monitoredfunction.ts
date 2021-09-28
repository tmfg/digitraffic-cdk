import {Function, FunctionProps} from '@aws-cdk/aws-lambda';
import {Stack} from "@aws-cdk/core";
import {ITopic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {ComparisonOperator} from "@aws-cdk/aws-cloudwatch";

export enum MonitoredFunctionAlarm {
    DURATION,
    ERRORS,
    THROTTLES
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

    constructor(
        scope: Stack,
        id: string,
        functionProps: FunctionProps,
        alarmSnsTopic: ITopic,
        props?: MonitoredFunctionProps) {

        super(scope, id, functionProps);

        const alarmSnsAction = new SnsAction(alarmSnsTopic);

        if (!functionProps.timeout) {
            throw new Error('Timeout needs to be explicitly set');
        }
        if (!props || props.includeAlarms?.includes(MonitoredFunctionAlarm.DURATION)) {
            this.metricDuration().createAlarm(scope, `${this.node.id}-Duration`, {
                alarmName: `${scope.stackName} ${this.functionName} duration alarm`,
                alarmDescription: `${this.functionName} duration has exceeded ${functionProps.timeout!.toSeconds()} seconds`,
                threshold: functionProps.timeout!.toMilliseconds(),
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                statistic: 'max',
                comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            }).addAlarmAction(alarmSnsAction);
        }

        if (!props || props.includeAlarms?.includes(MonitoredFunctionAlarm.ERRORS)) {
            this.metricErrors().createAlarm(scope, `${this.node.id}-Errors`, {
                alarmName: `${scope.stackName} ${this.functionName} errors alarm`,
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
                alarmName: `${scope.stackName} ${this.functionName} throttles alarm`,
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
