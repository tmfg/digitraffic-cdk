import {saveEstimates} from "../../service/estimates";
import {ApiEstimate} from "../../model/estimate";

export const handler = async (event: any, context: any): Promise<any> => {
    console.log('records size: ', event.Records.length);
    return await saveEstimates(event.Records as ApiEstimate[]);
};
