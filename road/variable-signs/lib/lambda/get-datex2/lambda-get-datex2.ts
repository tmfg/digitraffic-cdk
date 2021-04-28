import {findActiveSignsDatex2} from "../../service/variable-signs";

export const handler = async (event: any): Promise<any> => {
    const start = Date.now();

    try {
        return await findActiveSignsDatex2();
    } finally {
        console.info("method=findActiveSignsDatex2 tookMs=%d", (Date.now()-start));
    }
};
