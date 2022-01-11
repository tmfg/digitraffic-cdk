import {findActiveSignsDatex2} from "../../service/variable-signs";
import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/aws/types/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const start = Date.now();

    try {
        return await withDbSecret(secretId, () => {
            return findActiveSignsDatex2();
        });
    } finally {
        console.info("method=findActiveSignsDatex2 tookMs=%d", (Date.now()-start));
    }
};
