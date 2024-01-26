import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { DatabaseCanary } from "@digitraffic/common/dist/aws/infra/canaries/database-canary";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import type { PublicApi } from "./public-api.js";
import type { NauticalWarningsStack } from "./nautical-warnings-stack.js";

export class Canaries {
    constructor(stack: NauticalWarningsStack, publicApi: PublicApi) {
        if (stack.configuration.stackFeatures?.enableCanaries ?? true) {
            const urlRole = new DigitrafficCanaryRole(stack, "nw-url");
            const dbRole = new DigitrafficCanaryRole(stack, "nw-db").withDatabaseAccess();

            new UrlCanary(stack, urlRole, {
                name: "nw-public-api",
                hostname: publicApi.publicApi.hostname(),
                handler: "public-api.handler",
                alarm: {
                    alarmName: "NW-PublicAPI-Alarm",
                    topicArn: stack.configuration.warningTopicArn
                },
                apiKeyId: publicApi.apiKeyId
            });

            new DatabaseCanary(stack, dbRole, stack.secret, {
                name: "nw-db",
                secret: stack.configuration.secretId,
                handler: "db.handler",
                alarm: {
                    alarmName: "NW-Db-Alarm",
                    topicArn: stack.configuration.warningTopicArn
                }
            });
        }
    }
}
