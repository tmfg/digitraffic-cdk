#!/usr/bin/env node
///<reference path="../lib/app-props.d.ts"/>
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { Open311CdkStack } from '../lib/open311-cdk-stack';

(async () => {
    const profileName = process.env.AWS_PROFILE as string;
    const profilePropsFile = await import(`./dont-commit-this-props-${profileName}`);
    const profileProps = profilePropsFile['default'];

    const app = new cdk.App();
    new Open311CdkStack(app, 'Open311CdkStack', profileProps);
})();
