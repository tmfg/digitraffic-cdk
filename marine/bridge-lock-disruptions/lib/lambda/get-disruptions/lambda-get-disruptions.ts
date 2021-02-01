import {findAllDisruptions} from "../../service/disruptions";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

export const handler = async (): Promise<any> => {
    return handlerFn(withDbSecret);
};

export function handlerFn(withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>): Promise<any> {
    return withDbSecretFn(process.env.SECRET_ID as string, (_: any): Promise<any> => {
        return findAllDisruptions();
    });
}
