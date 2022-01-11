import {SecretFunction, withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/aws/types/lambda-environment";
import {NauticalWarningsSecret} from "../../model/secret";
import * as NauticalWarningsService from "../../service/nautical-warnings";

const secretId = process.env[SECRET_ID] as string;

export function handlerFn(doWithSecret: SecretFunction<NauticalWarningsSecret>) {
    return doWithSecret(secretId, (secret: NauticalWarningsSecret) => {
        return NauticalWarningsService.updateNauticalWarnings(secret.url);
    }, {
        prefix: 'nauticalwarnings',
    });
}

export const handler = (): Promise<void> => {
    return handlerFn(withDbSecret);
};
