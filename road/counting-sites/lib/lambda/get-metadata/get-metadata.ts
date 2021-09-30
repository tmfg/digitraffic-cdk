import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = async (event: any): Promise<any> => {
    await withDbSecret(secretId, (secret: any) => {
        return CountingSitesService.getMetadata();
    });
};

