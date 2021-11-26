import {DbSecret, SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import * as NauticalWarningsService from "../../service/nautical-warnings";

const secretId = process.env[SECRET_ID] as string;

export async function handlerFn(doWithSecret: SecretFunction<DbSecret, any>) {
    return doWithSecret(secretId, async () => {
        return NauticalWarningsService.getActiveWarnings();
    });
}

export const handler = async (): Promise<any> => {
    return handlerFn(withDbSecret);
}
