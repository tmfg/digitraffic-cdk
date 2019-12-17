import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import CloudWatchLogsRecipient = require('../lib/cloudwatch-logs-recipient-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CloudWatchLogsRecipient.CloudWatchLogsRecipientStack(app, 'MyTestStack', {
        applicationAccountId: '1234567890'
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});