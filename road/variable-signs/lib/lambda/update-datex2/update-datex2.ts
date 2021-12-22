import {updateDatex2} from "../../service/variable-sign-updater";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import {GenericSecret} from "digitraffic-common/secrets/secret";

const secretId = process.env[SECRET_ID_KEY] as string;

export type StatusCodeValue = {
    readonly statusCode: number;
}

export const handler = async (event: Record<string, string>) : Promise<StatusCodeValue | void> => {
    return handlerFn(withDbSecret, event);
};

export function handlerFn(withDbSecretFn: SecretFunction<GenericSecret, StatusCodeValue>, event: Record<string, string>): Promise<StatusCodeValue | void> {
    return withDbSecretFn(secretId, async () => {
        const datex2 = event.body;

        if (datex2) {
            console.info('DEBUG ' + datex2);

            try {
                return await updateDatex2(datex2);
            } catch (e) {
                return {statusCode: 500};
            }
        }

        return {statusCode:400};
    });
}
