import { App, Stack } from "aws-cdk-lib";
import { Scheduler } from "../../aws/infra/scheduler.js";
import { Template } from "aws-cdk-lib/assertions";

describe("scheduler tests", () => {
    function expectRate(createScheduler: (stack: Stack) => Scheduler, expectedRate: string): void {
        const app = new App();
        const stack = new Stack(app);

        createScheduler(stack);

        const template = Template.fromStack(stack);

        template.hasResource("AWS::Events::Rule", {
            Properties: {
                ScheduleExpression: expectedRate,
                State: "ENABLED",
            },
        });
    }

    test("everyMinute", () => expectRate((stack) => Scheduler.everyMinute(stack, "test"), "rate(1 minute)"));

    test("everyMinutes", () =>
        expectRate((stack) => Scheduler.everyMinutes(stack, "test", 12), "rate(12 minutes)"));

    test("everyHour", () => expectRate((stack) => Scheduler.everyHour(stack, "test"), "rate(1 hour)"));

    test("everyDay", () => expectRate((stack) => Scheduler.everyDay(stack, "test"), "rate(1 day)"));
});
