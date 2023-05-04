import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { SNSEvent } from "aws-lambda";
import { AwakeAiETAShipApi } from "../../api/awake_ai_ship";
import { DbETAShip } from "../../dao/timestamps";
import { PortactivityEnvKeys } from "../../keys";
import { AwakeAiETAShipService } from "../../service/awake_ai_eta_ship";
import { sendMessage } from "../../service/queue-service";

let service: AwakeAiETAShipService | undefined;

const queueUrl = getEnvVariable(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

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
            "method=updateAwakeAiETAShipTimestamps.handler count=%d",
            timestamps.length
        );
        await Promise.allSettled(
            timestamps.map((ts) => sendMessage(ts, queueUrl))
        );
        console.info(
            "method=updateAwakeAiETAShipTimestamps.handler tookMs=%d",
            Date.now() - start
        );
    });
};
