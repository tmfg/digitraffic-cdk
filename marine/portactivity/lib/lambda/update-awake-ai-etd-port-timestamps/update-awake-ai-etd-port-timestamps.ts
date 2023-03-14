import { PortactivitySecretKeys } from "../../keys";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { AwakeAiETDPortService } from "../../service/awake_ai_etd_port";
import { AwakeAiPortApi } from "../../api/awake_ai_port";

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_URL,
    PortactivitySecretKeys.AWAKE_AUTH,
];

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<GenericSecret>("", expectedKeys);

let service: AwakeAiETDPortService | undefined;

export function handler(): Promise<void> {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            if (!service) {
                service = new AwakeAiETDPortService(
                    new AwakeAiPortApi(
                        secret["awake.voyagesurl"],
                        secret["awake.voyagesauth"]
                    )
                );
            }
            const timestamps = await service.getAwakeAiTimestamps("FIHEL");

            console.info(
                "method=updateAwakeAiETAPortTimestamps.handler count=%d",
                timestamps.length
            );
            
        });
}
