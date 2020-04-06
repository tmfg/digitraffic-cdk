import {findAllDisruptions} from "../../service/disruptions";
import {Language} from "../../../../common/model/language";

export const handler = async () : Promise <any> => {
    const start = Date.now();
    try {
        return await findAllDisruptions();
    } finally {
        console.info("method=findAllDisruptions tookMs=%d", (Date.now()-start));
    }
};
