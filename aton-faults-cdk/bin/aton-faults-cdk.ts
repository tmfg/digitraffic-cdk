#!/usr/bin/env node
///<reference path="../lib/app-props.d.ts"/>
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import {AtonFaultsCdkStack} from "../lib/aton-faults-cdk-stack";

(async () => {
    const profileName = process.env.AWS_PROFILE as string;
    if (!profileName) {
        throw Error('AWS_PROFILE not set');
    }
    const profilePropsFile = await import(`./dont-commit-this-props-${profileName}`);
    const profileProps = profilePropsFile['default'];

    const app = new cdk.App();
    new AtonFaultsCdkStack(app, 'atonFaultsCdkStack', profileProps);
    app.synth();
})();
