import {ProxyLambdaResponse} from "@digitraffic/common/aws/types/proxytypes";
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";
import * as rcs from "../../service/road-network-conditions-service";
import {Alarms} from "../../model/alarms";
import {DOMAIN_PREFIX, RoadNetworkConditionsSecret} from "../../model/road-network-conditions-secret";
import {DigitrafficRestApi} from "@digitraffic/common/aws/infra/stack/rest_apis";

const holder = SecretHolder.create<RoadNetworkConditionsSecret>(DOMAIN_PREFIX);

export async function handler(event: DigitrafficRestApi): Promise<ProxyLambdaResponse> {
    const secret = await holder.get();

    const result: Alarms = await rcs.getAlarms(secret.apiKey, secret.url);

    return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: {
            "content-type": MediaType.APPLICATION_JSON,
        },
    };
}
