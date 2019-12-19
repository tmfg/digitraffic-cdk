import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import CloudWatchLogsRecipient = require('../lib/cloudwatch-logs-recipient-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CloudWatchLogsRecipient.CloudWatchLogsRecipientStack(app, 'MyTestStack', {
        accounts: [],
        elasticSearchEndpoint: 'http://no-such-doma.in',
        elasticSearchDomainArn: 'arn:aws:es:some-region:123456789012:domain/some-domain'
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});