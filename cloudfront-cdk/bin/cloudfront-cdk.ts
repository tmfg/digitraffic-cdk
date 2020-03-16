#!/usr/bin/env node
///<reference path="../lib/app-props.d.ts"/>
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import {CloudfrontCdkStack} from "../lib/cloudfront-cdk-stack";

(async () => {
    const profileName = process.env.AWS_PROFILE as string;
    if (!profileName) {
        throw Error('AWS_PROFILE not set');
    }
    const profilePropsFile = await import(`./dont-commit-this-cdk-${profileName}`);
    const profileProps = profilePropsFile['default'];

    const app = new cdk.App();
    const cfStack = new CloudfrontCdkStack(app, profileProps, { env: { region: "us-east-1" } });

    app.synth();
})();
