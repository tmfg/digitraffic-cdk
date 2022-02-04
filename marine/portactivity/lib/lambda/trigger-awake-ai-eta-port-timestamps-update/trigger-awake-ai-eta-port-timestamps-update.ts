import {PortactivityEnvKeys} from "../../keys";
import {SNS} from "aws-sdk";
import * as MessagingUtil from 'digitraffic-common/aws/runtime/messaging';

const publishTopic = process.env[PortactivityEnvKeys.PUBLISH_TOPIC_ARN] as string;

// TODO in the future, use ports list
const ports = [
    'FIKOK',
];

export function handlerFn(sns: SNS) {
    return async () => {
        console.info('method=triggerAwakeAiETAPortTimestampsUpdateHandler Triggering ETA port update for count=%d ports', ports.length);
        for (const port of ports) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
