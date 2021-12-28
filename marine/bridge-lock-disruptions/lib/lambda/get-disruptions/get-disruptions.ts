import {findAllDisruptions} from "../../service/disruptions";
import {EmptySecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";
import {FeatureCollection} from "geojson";

export const handler = () => {
    return handlerFn(withDbSecret);
};

export async function handlerFn(withDbSecretFn: EmptySecretFunction<FeatureCollection>): Promise<LambdaResponse<string>> {
    try {
        const disruptions = await withDbSecretFn(process.env.SECRET_ID as string, () => {
            return findAllDisruptions();
        }) as FeatureCollection;
        return LambdaResponse.ok(JSON.stringify(disruptions));
    } catch (error) {
        console.error('method=getDisruptionsHandler error', error);
        return LambdaResponse.internalError();
    }
}
