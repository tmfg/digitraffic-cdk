import {SecretFunction} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {NauticalWarningsSecret} from "../../model/secret";
import * as NauticalWarningsService from "../../service/nautical-warnings";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create<NauticalWarningsSecret>('nauticalwarnings');

const secretId = process.env.SECRET_ID as string;

export function handlerFn(doWithSecret: SecretFunction<NauticalWarningsSecret>) {
    return doWithSecret(secretId, (secret: NauticalWarningsSecret) => {
        return NauticalWarningsService.updateNauticalWarnings(secret.url);
    }, {
        prefix: 'nauticalwarnings',
    });
}

export const handler = () => {
    return secretHolder.setDatabaseCredentials()
        .then(() => secretHolder.get())
        .then(secret => NauticalWarningsService.updateNauticalWarnings(secret.url));
};
