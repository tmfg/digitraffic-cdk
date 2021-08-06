import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {LogGroup, FilterPattern} from '@aws-cdk/aws-logs';
import {Stream} from '@aws-cdk/aws-kinesis';
import {KinesisDestination} from '@aws-cdk/aws-logs-destinations';

export class AppLogsSubscriptionStack extends Stack {
    constructor(scope: Construct, id: string, appProps: AppLogSubscription, props?: StackProps) {
        super(scope, id, props);

        const kinesisStream = Stream.fromStreamArn(this, 'kinesis-stream', appProps.destinationArn);
        const kinesisDestination = new KinesisDestination(kinesisStream);

        appProps.logGroupNames.forEach(name => this.createSubscriptions(scope, kinesisDestination, name));
    }

    createSubscriptions(scope: Construct, kinesisDestination: KinesisDestination, logGroupName: string) {
        const logGroup = LogGroup.fromLogGroupName(this, logGroupName, logGroupName);

        if(logGroup != null) {
            logGroup.addSubscriptionFilter(`kinesis-subscription`, {
                destination: kinesisDestination,
                filterPattern: FilterPattern.allEvents()
            });
        }
    }
}
