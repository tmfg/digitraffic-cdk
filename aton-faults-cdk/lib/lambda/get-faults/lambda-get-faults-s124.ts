import {findAllFaultsS124} from "../../service/faults";

export const handler = async () : Promise <any> => {
    const start = Date.now();

    try {
        return await findAllFaultsS124();
    } finally {
        console.info("method=findAllFaultsS124 tookMs=%d", (Date.now()-start));
    }
};
