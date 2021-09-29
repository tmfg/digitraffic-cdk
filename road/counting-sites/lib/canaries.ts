import {AppProps} from "./app-props";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";
import {createCanaryRole} from "digitraffic-common/canaries/canary";
import {DatabaseCanary} from "digitraffic-common/canaries/database-canary";
import {Schedule} from "@aws-cdk/aws-events";

export class Canaries {
    constructor(stack: Construct, secret: ISecret, vpc: IVpc, lambdaDbSg: ISecurityGroup, appProps: AppProps) {
        if(appProps.enableCanaries) {
            const role = createCanaryRole(stack, 'counting-sites');

            new DatabaseCanary(stack, role, secret, vpc, lambdaDbSg, {
                name: 'counting-sites',
                secret: appProps.secretId,
                schedule: Schedule.expression("cron(0/15 2-19 ? * MON-SUN *)"),
                handler: 'db.handler',
                alarm: {
                    alarmName: 'CountingSites-Db-Alarm',
                    topicArn: appProps.alarmTopicArn
                }
            });
        }
    }
}
