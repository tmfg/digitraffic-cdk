import {PortactivityEnvKeys} from "../../keys";
import {SNS} from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import {getEnvVariable} from "@digitraffic/common/dist/utils/utils";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

const ports = ["FIHEL", "FIHKO", "FIKEM", "FIKOK", "FIKTK", "FIMHQ", "FINLI", "FIOUL", "FIPRS", "FIRAU", "FISKV", "FITKU", "FITOR", "FIUKI", "FIVSS"];

export function handlerFn(sns: SNS) {
    return async () => {
        console.info(
            "method=triggerAwakeAiETDPortTimestampsUpdate.handler Triggering ETD port update for count=%d ports",
            ports.length
        );
        for (const port of ports) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
