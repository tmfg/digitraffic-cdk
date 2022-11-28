import { PortactivityEnvKeys } from "../../keys";
import { AwakeAiETAShipService } from "../../service/awake_ai_eta_ship";
import { AwakeAiETAShipApi } from "../../api/awake_ai_ship";
import { SNSEvent } from "aws-lambda";
import { DbETAShip } from "../../dao/timestamps";
import { sendMessage } from "../../service/queue-service";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

let service: AwakeAiETAShipService | undefined;

const queueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

interface UpdateAwakeAiTimestampsSecret extends GenericSecret {
    readonly voyagesurl: string;
    readonly voyagesauth: string;
}

const secretHolder = SecretHolder.create<UpdateAwakeAiTimestampsSecret>(
    "awake",
    ["url", "auth"]
);

export const handler = (event: SNSEvent) => {
    // always a single event, guaranteed by SNS
    const ships = JSON.parse(event.Records[0].Sns.Message) as DbETAShip[];

    return secretHolder.get().then(async (secret) => {
        if (!service) {
            service = new AwakeAiETAShipService(
                new AwakeAiETAShipApi(secret.voyagesurl, secret.voyagesauth)
            );
        }
        const timestamps = await service.getAwakeAiTimestamps(ships);

        const start = Date.now();
        console.info(
            "method=updateAwakeAiETAShipTimestampsHandler Sending timestamps to queue.."
        );
        await Promise.allSettled(
            timestamps.map((ts) => sendMessage(ts, queueUrl))
        );
        console.info(
            "method=updateAwakeAiETAShipTimestampsHandler ..done in tookMs=%d",
            Date.now() - start
        );
    });
};
