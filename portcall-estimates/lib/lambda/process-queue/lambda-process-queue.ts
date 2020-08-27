import {saveEstimates} from "../../service/estimates";
import {ApiEstimate, validateEstimate} from "../../model/estimate";

export const handler = async (event: any, context: any): Promise<any> => {
    console.info(`method=portcallEstimatesProcessQueue portCallRecordsReceived=${event.Records.length}`);
    const estimates = event.Records.map((e: any) => JSON.parse(e.body) as ApiEstimate);
    return await saveEstimates(estimates.filter(validateEstimate));
};
