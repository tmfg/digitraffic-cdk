import {findActiveSignsDatex2} from "../../service/variable-signs";
import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = async (): Promise<any> => {
    const start = Date.now();

    try {
        return await withDbSecret(secretId, async () => {
            return await findActiveSignsDatex2();
        });
    } finally {
        console.info("method=findActiveSignsDatex2 tookMs=%d", (Date.now()-start));
    }
};
