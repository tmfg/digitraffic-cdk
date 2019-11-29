import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Open311Cdk = require('../lib/open311-cdk-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Open311Cdk.Open311CdkStack(app, 'MyTestStack', {
        vpcId: 'testVpcId',
        privateSubnetIds: ['subnet-foo'],
        availabilityZones: ['test-az1'],
        lambdaDbSgId: 'sg-test',
        dbProps: {
            username: 'test',
            password: 'test',
            uri: 'test:5432/test'
        }
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});