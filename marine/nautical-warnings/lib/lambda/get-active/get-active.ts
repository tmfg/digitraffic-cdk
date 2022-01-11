import {DbSecret, SecretFunction, withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as NauticalWarningsService from "../../service/nautical-warnings";
import {FeatureCollection} from "geojson";

const secretId = process.env.SECRET_ID as string;

export function handlerFn(doWithSecret: SecretFunction<DbSecret, void | FeatureCollection | null>) {
    return doWithSecret(secretId, () => {
        return NauticalWarningsService.getActiveWarnings();
    });
}

export const handler = (): Promise<void | FeatureCollection | null> => {
    return handlerFn(withDbSecret);
};
