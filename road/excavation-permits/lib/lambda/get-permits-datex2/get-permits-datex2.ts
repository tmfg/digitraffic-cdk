import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const holder = SecretHolder.create();

export const handler = async () => {
    await holder.setDatabaseCredentials();

    // TODO
    return LambdaResponse.notFound();
};

