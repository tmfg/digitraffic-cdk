import {Function, FunctionProps} from '@aws-cdk/aws-lambda';
import {Stack} from "@aws-cdk/core";
import {ITopic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {ComparisonOperator, Metric} from "@aws-cdk/aws-cloudwatch";
import {TrafficType} from '../model/traffictype';

/**
 * Allows customization of CloudWatch Alarm properties
 */
export type MonitoredFunctionAlarmProps = {
    /**
     * Setting this to false will not create a CloudWatch alarm
     */
    readonly create: boolean

    readonly threshold?: number

    readonly evaluationPeriods?: number

    readonly datapointsToAlarm?: number

    readonly statistic?: string

    readonly comparisonOperator?: ComparisonOperator
}

export type MonitoredFunctionProps = {

    readonly durationAlarmProps?: MonitoredFunctionAlarmProps

    readonly durationWarningProps?: MonitoredFunctionAlarmProps

    readonly errorAlarmProps?: MonitoredFunctionAlarmProps

    readonly throttleAlarmProps?: MonitoredFunctionAlarmProps
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

        if (props?.durationAlarmProps?.create !== false) {
            if (!functionProps.timeout) {
                throw new Error('Timeout needs to be explicitly set');
            }
            this.createAlarm(scope,
                this.metricDuration(),
                'Duration',
                'Duration alarm',
                `Duration has exceeded ${functionProps.timeout!.toSeconds()} seconds`,
                trafficType,
                alarmSnsAction,
                functionProps.timeout!.toMilliseconds(),
                1,
                1,
                'max',
                ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                props?.durationAlarmProps);
        }
        if (props?.durationWarningProps?.create !== false) {
            if (!functionProps.timeout) {
                throw new Error('Timeout needs to be explicitly set');
            }
            this.createAlarm(scope,
                this.metricDuration(),
                'Duration-Warning',
                'Duration warning',
                `Duration is 85 % of max ${functionProps.timeout!.toSeconds()} seconds`,
                trafficType,
                warningSnsAction,
                functionProps.timeout!.toMilliseconds() * 0.85,
                1,
                1,
                'max',
                ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                props?.durationWarningProps);
        }

        if (props?.errorAlarmProps?.create !== false) {
            this.createAlarm(scope,
                this.metricErrors(),
                'Errors',
                'Errors alarm',
                'Invocations did not succeed',
                trafficType,
                alarmSnsAction,
                1,
                1,
                1,
                'sum',
                ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                props?.errorAlarmProps);
        }

        if (props?.throttleAlarmProps?.create !== false) {
            this.createAlarm(scope,
                this.metricThrottles(),
                'Throttles',
                'Throttles alarm',
                'Has throttled',
                trafficType,
                alarmSnsAction,
                0,
                1,
                1,
                'sum',
                ComparisonOperator.GREATER_THAN_THRESHOLD,
                props?.throttleAlarmProps);
        }
    }

    private createAlarm(
        scope: Stack,
        metric: Metric,
        alarmId: string,
        alarmName: string,
        alarmDescription: string,
        trafficType: TrafficType | null,
        alarmSnsAction: SnsAction,
        threshold: number,
        evaluationPeriods: number,
        datapointsToAlarm: number,
        statistic: string,
        comparisonOperator: ComparisonOperator,
        alarmProps?: MonitoredFunctionAlarmProps
    ) {
        metric.createAlarm(scope, `${this.node.id}-${alarmId}`, {
            alarmName: `${trafficType ?? ''} ${scope.stackName} ${this.functionName} ${alarmName}`.trim(),
            alarmDescription,
            threshold: alarmProps?.threshold ?? threshold,
            evaluationPeriods: alarmProps?.evaluationPeriods ?? evaluationPeriods,
            datapointsToAlarm: alarmProps?.datapointsToAlarm ?? datapointsToAlarm,
            statistic: alarmProps?.statistic ?? statistic,
            comparisonOperator: alarmProps?.comparisonOperator ?? comparisonOperator
        }).addAlarmAction(alarmSnsAction);
    }

}
