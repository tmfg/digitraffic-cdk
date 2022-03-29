import * as NauticalWarningsService from "../../service/nautical-warnings";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create();

export const handler = () => {
    return secretHolder.setDatabaseCredentials()
        .then(() => NauticalWarningsService.getActiveWarnings());
};
