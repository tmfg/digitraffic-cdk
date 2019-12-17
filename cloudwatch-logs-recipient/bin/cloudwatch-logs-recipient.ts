#!/usr/bin/env node

///<reference path="../lib/app-props.d.ts"/>
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CloudWatchLogsRecipientStack } from '../lib/cloudwatch-logs-recipient-stack';

(async () => {
    const profileName = process.env.AWS_PROFILE as string;
    if (!profileName) {
        throw Error('AWS_PROFILE not set');
    }
    const profilePropsFile = await import(`./dont-commit-this-props-${profileName}`);
    const profileProps = <Props> profilePropsFile['default']

    const app = new cdk.App();
    new CloudWatchLogsRecipientStack(app, 'CloudWatchLogsRecipientStack', profileProps);
    app.synth();
})();
