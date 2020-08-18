import {saveEstimates} from "../../service/estimates";
import {ApiEstimate} from "../../model/estimate";

export const handler = async (event: any, context: any): Promise<any> => {
    console.info('Records size: ', event.Records.length);
    return await saveEstimates(event.Records.map((e: any) => JSON.parse(e.body) as ApiEstimate));
};
