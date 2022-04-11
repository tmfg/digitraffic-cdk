import {updateDatex2} from "../../service/variable-sign-updater";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export type StatusCodeValue = {
    readonly statusCode: number;
}

export const handler = async (event: Record<string, string>) : Promise<StatusCodeValue | void> => {
    const datex2 = event.body;

    if (datex2) {
        console.info('DEBUG ' + datex2);

        return proxyHolder.setCredentials()
            .then(() => updateDatex2(datex2))
            .catch(() => ({
                statusCode: 500,
            }));
    }
    return {statusCode:400};
};
