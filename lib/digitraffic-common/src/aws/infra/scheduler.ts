import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { Duration } from "aws-cdk-lib";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import type { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

export class Scheduler extends Rule {
    constructor(stack: Construct, ruleName: string, schedule: Schedule, lambda?: AWSFunction) {
        super(stack, ruleName, { ruleName, schedule });

        if (lambda) {
            this.addTarget(new LambdaFunction(lambda));
        }
    }

    static everyMinute(stack: Construct, ruleName: string, lambda?: AWSFunction): Scheduler {
        return Scheduler.every(stack, ruleName, Duration.minutes(1), lambda);
    }

    static everyMinutes(
        stack: Construct,
        ruleName: string,
        minutes: number,
        lambda?: AWSFunction,
    ): Scheduler {
        return Scheduler.every(stack, ruleName, Duration.minutes(minutes), lambda);
    }

    static everyHour(stack: Construct, ruleName: string, lambda?: AWSFunction): Scheduler {
        return Scheduler.every(stack, ruleName, Duration.hours(1), lambda);
    }

    static everyDay(stack: Construct, ruleName: string, lambda?: AWSFunction): Scheduler {
        return Scheduler.every(stack, ruleName, Duration.days(1), lambda);
    }

    static every(stack: Construct, ruleName: string, duration: Duration, lambda?: AWSFunction): Scheduler {
        return new Scheduler(stack, ruleName, Schedule.rate(duration), lambda);
    }
}
