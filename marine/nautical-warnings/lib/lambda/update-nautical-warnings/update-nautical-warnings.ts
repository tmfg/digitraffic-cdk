import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {NauticalWarningsSecret} from "../../model/secret";
import * as NauticalWarningsService from "../../service/nautical-warnings";

const secretId = process.env[SECRET_ID] as string;

export async function handlerFn(doWithSecret: SecretFunction<NauticalWarningsSecret, void>) {
    return doWithSecret(secretId, async (secret: NauticalWarningsSecret) => {
        return NauticalWarningsService.updateNauticalWarnings(secret.url);
    }, {
        prefix: 'nauticalwarnings'
    });
}

export const handler = async (): Promise<void> => {
    return handlerFn(withDbSecret);
}
