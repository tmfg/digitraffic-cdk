import { ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";

export interface AlarmProps {
  readonly threshold?: number;
  readonly evaluationPeriods: number;
  readonly datapointsToAlarm: number;
  readonly comparisonOperator: ComparisonOperator;
}

export class DtFunctionAlarms {
  durationAlarm?: AlarmProps = {
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  };

  durationWarning?: AlarmProps = {
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  };

  errorAlarms?: AlarmProps = {
    threshold: 1,
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  };

  throttleAlarm?: AlarmProps = {
    threshold: 1,
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  };

  /**
   * Set throttle alarm.  Undefined disables the alarm.
   */
  withThrottleAlarm(throttleAlarm?: AlarmProps): this {
    this.throttleAlarm = throttleAlarm;

    return this;
  }

  /**
   * Set error alarm.  Undefined disables the alarm.
   */
  withErrorAlarm(errorAlarm?: AlarmProps): this {
    this.errorAlarms = errorAlarm;

    return this;
  }

  /**
   * Set duration alarm.  Undefined disables the alarm.
   */
  withDurationAlarm(durationAlarmn?: AlarmProps): this {
    this.durationAlarm = durationAlarmn;

    return this;
  }

  /**
   * Set duration warning.  Undefined disables the warning.
   */
  withDurationWarning(durationWarning?: AlarmProps): this {
    this.durationWarning = durationWarning;

    return this;
  }
}
