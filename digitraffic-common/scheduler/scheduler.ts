import {Rule, Schedule} from "@aws-cdk/aws-events";
import {Construct, Duration} from "@aws-cdk/core";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {Function} from '@aws-cdk/aws-lambda';

export class Scheduler extends Rule {
    constructor(stack: Construct, ruleName: string, schedule: Schedule, lambda?: Function) {
        super(stack, ruleName, { ruleName, schedule });

        if(lambda) {
            this.addTarget(new LambdaFunction(lambda));
        }
    }

    static everyMinute(stack: Construct, ruleName: string, lambda?: Function) {
        return new Scheduler(stack, ruleName, Schedule.rate(Duration.minutes(1)), lambda);
    }

    static everyMinutes(stack: Construct, ruleName: string, minutes: number, lambda?: Function) {
        return new Scheduler(stack, ruleName, Schedule.rate(Duration.minutes(minutes)), lambda);
    }

    static everyHour(stack: Construct, ruleName: string, lambda?: Function) {
        return new Scheduler(stack, ruleName, Schedule.rate(Duration.hours(1)), lambda);
    }
}