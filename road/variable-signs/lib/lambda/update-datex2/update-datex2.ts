import {updateDatex2} from "../../service/variable-sign-updater";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = async (event: any) : Promise <any> => {
    return handlerFn(withDbSecret, event);
};

export function handlerFn(withDbSecretFn: (secretId: string, fn: (secret: any) => Promise<void>) => Promise<any>, event: any): Promise<any> {
    return withDbSecretFn(secretId, async () => {
        const datex2 = event.body;

        if(datex2) {
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
