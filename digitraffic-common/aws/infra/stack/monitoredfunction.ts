import {Function, FunctionProps} from 'aws-cdk-lib/aws-lambda';
import {Stack} from "aws-cdk-lib";
import {SnsAction} from "aws-cdk-lib/aws-cloudwatch-actions";
import {ComparisonOperator, Metric} from "aws-cdk-lib/aws-cloudwatch";
import {DigitrafficStack} from "../stack/stack";
import {ITopic} from "aws-cdk-lib/aws-sns";
import {databaseFunctionProps, LambdaEnvironment, MonitoredFunctionParameters} from "../stack/lambda-configs";
import {pascalCase} from "change-case";
import {DigitrafficLogSubscriptions} from "../stack/subscription";
import {TrafficType} from "../../../types/traffictype";

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
    readonly givenName: string;

    /** disable all alarms */
    public static readonly DISABLE_ALARMS: MonitoredFunctionProps = {
        durationAlarmProps: {
            create: false,
        },
        durationWarningProps: {
            create: false,
        },
        errorAlarmProps: {
            create: false,
        },
        throttleAlarmProps: {
            create: false,
        },
    };

    /**
     * Create new MonitoredFunction.  Use topics from given DigitrafficStack.
     *
     * @param stack DigitrafficStack
     * @param id Lambda construct Id
     * @param functionProps Lambda function properties
     * @param props Monitored function properties
     */
    static create(stack: DigitrafficStack,
        id: string,
        functionProps: FunctionProps,
        props?: MonitoredFunctionProps): MonitoredFunction {

        if (props === MonitoredFunction.DISABLE_ALARMS && stack.configuration.production) {
            throw new Error(`Function ${functionProps.functionName} has DISABLE_ALARMS.  Remove before installing to production or define your own properties!`);
        }

        return new MonitoredFunction(
            stack,
            id,
            functionProps,
            stack.alarmTopic,
            stack.warningTopic,
            stack.configuration.production,
            stack.configuration.trafficType,
            props,
        );
    }

    /**
     * Create new MonitoredFunction.  Use topics from given DigitrafficStack.  Generate names from given name and configuration shortName.
     *
     * For example, shortName FOO and given name update-things will create function FOO-UpdateThings and use code from lambda/update-things/update-things.ts method handler.
     *
     * @param stack DigitrafficStack
     * @param name param-case name
     * @param environment Lambda environment
     * @param functionParameters Lambda function parameters
     */
    static createV2(stack: DigitrafficStack,
        name: string,
        environment: LambdaEnvironment,
        functionParameters?: MonitoredFunctionParameters): MonitoredFunction {
        const functionName = functionParameters?.functionName || `${stack.configuration.shortName}-${pascalCase(name)}`;
        const functionProps = databaseFunctionProps(
            stack, environment, functionName, name, functionParameters,
        );

        return MonitoredFunction.create(stack, functionName, functionProps, functionParameters);
    }

    /**
     * @param scope Stack
     * @param id Lambda construct Id
     * @param functionProps Lambda function properties
     * @param alarmSnsTopic SNS topic for alarms
     * @param warningSnsTopic SNS topic for warnings
     * @param production Is the stack a production stack, used for determining the alarm topic
     * @param trafficType Traffic type, used for alarm names. Set to null if Lambda is not related to any traffic type.
     * @param props Monitored function properties
     */
    constructor(
        scope: Stack,
        id: string,
        functionProps: FunctionProps,
        alarmSnsTopic: ITopic,
        warningSnsTopic: ITopic,
        production: boolean,
        trafficType: TrafficType | null,
        props?: MonitoredFunctionProps,
    ) {
        super(scope, id, functionProps);

        this.givenName = functionProps.functionName as string;

        const alarmSnsAction = new SnsAction(alarmSnsTopic);
        const warningSnsAction = new SnsAction(warningSnsTopic);

        if (props?.durationAlarmProps?.create !== false) {
            if (!functionProps.timeout) {
                throw new Error('Timeout needs to be explicitly set');
            }

            this.createAlarm(
                scope,
                this.metricDuration().with({statistic: 'max'}),
                'Duration',
                'Duration alarm',
                `Duration has exceeded ${functionProps.timeout.toSeconds()} seconds`,
                trafficType,
                this.getAlarmActionForEnv(alarmSnsAction, warningSnsAction, production),
                functionProps.timeout.toMilliseconds(),
                1,
                1,
                ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                props?.durationAlarmProps,
            );
        }
        if (props?.durationWarningProps?.create !== false) {
            if (!functionProps.timeout) {
                throw new Error('Timeout needs to be explicitly set');
            }

            this.createAlarm(
                scope,
                this.metricDuration().with({statistic: 'max'}),
                'Duration-Warning',
                'Duration warning',
                `Duration is 85 % of max ${functionProps.timeout.toSeconds()} seconds`,
                trafficType,
                warningSnsAction,
                functionProps.timeout.toMilliseconds() * 0.85,
                1,
                1,
                ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                props?.durationWarningProps,
            );
        }

        if (props?.errorAlarmProps?.create !== false) {
            this.createAlarm(
                scope,
                this.metricErrors(),
                'Errors',
                'Errors alarm',
                'Invocations did not succeed',
                trafficType,
                this.getAlarmActionForEnv(alarmSnsAction, warningSnsAction, production),
                1,
                1,
                1,
                ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                props?.errorAlarmProps,
            );
        }

        if (props?.throttleAlarmProps?.create !== false) {
            this.createAlarm(
                scope,
                this.metricThrottles(),
                'Throttles',
                'Throttles alarm',
                'Has throttled',
                trafficType,
                this.getAlarmActionForEnv(alarmSnsAction, warningSnsAction, production),
                0,
                1,
                1,
                ComparisonOperator.GREATER_THAN_THRESHOLD,
                props?.throttleAlarmProps,
            );
        }
    }

    private createAlarm(
        stack: Stack,
        metric: Metric,
        alarmId: string,
        alarmName: string,
        alarmDescription: string,
        trafficType: TrafficType | null,
        alarmSnsAction: SnsAction,
        threshold: number,
        evaluationPeriods: number,
        datapointsToAlarm: number,
        comparisonOperator: ComparisonOperator,
        alarmProps?: MonitoredFunctionAlarmProps,
    ) {
        metric.createAlarm(stack, `${this.node.id}-${alarmId}`, {
            alarmName: `${trafficType ?? ''} ${stack.stackName} ${this.functionName} ${alarmName}`.trim(),
            alarmDescription,
            threshold: alarmProps?.threshold ?? threshold,
            evaluationPeriods: alarmProps?.evaluationPeriods ?? evaluationPeriods,
            datapointsToAlarm: alarmProps?.datapointsToAlarm ?? datapointsToAlarm,
            comparisonOperator: alarmProps?.comparisonOperator ?? comparisonOperator,
        }).addAlarmAction(alarmSnsAction);
    }

    private getAlarmActionForEnv(alarmAction: SnsAction,
        warningAction: SnsAction,
        production: boolean): SnsAction {

        return production ? alarmAction : warningAction;
    }
}

export class MonitoredDBFunction {
    /**
     * Create new MonitoredDBFunction.  Use topics from given DigitrafficStack.  Generate names from given name and configuration shortName.
     * Grant secret and create log subscription.
     *
     * For example, shortName FOO and given name update-things will create function FOO-UpdateThings and use code from lambda/update-things/update-things.ts method handler.
     *
     * If you don't need to pass any extra arguments to lambda-environment, you can leave environment out and this function will create the
     * default Lambda Environment with SECRET_ID and DB_APPLICATION.
     *
     * @param stack DigitrafficStack
     * @param name param-case name
     * @param environment Lambda environment
     * @param functionParameters Lambda function parameters
     */
    static create(stack: DigitrafficStack,
        name: string,
        environment?: LambdaEnvironment,
        functionParameters?: MonitoredFunctionParameters): MonitoredFunction {
        const functionName = functionParameters?.functionName || `${stack.configuration.shortName}-${pascalCase(name)}`;
        const env = environment ? environment : stack.createLambdaEnvironment();
        const functionProps = databaseFunctionProps(
            stack, env, functionName, name, functionParameters,
        );

        const mf = MonitoredFunction.create(stack, functionName, functionProps, functionParameters);

        stack.grantSecret(mf);

        if (stack.configuration.logsDestinationArn) {
            new DigitrafficLogSubscriptions(stack, mf);
        }

        return mf;
    }
}
