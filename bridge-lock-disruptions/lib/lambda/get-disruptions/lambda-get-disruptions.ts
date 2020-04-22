import {findAllDisruptions} from "../../service/disruptions";

export const handler = async () : Promise <any> => {
    const start = Date.now();
    try {
        return await findAllDisruptions();
    } finally {
        console.info("method=findAllDisruptions tookMs=%d", (Date.now()-start));
    }
};
