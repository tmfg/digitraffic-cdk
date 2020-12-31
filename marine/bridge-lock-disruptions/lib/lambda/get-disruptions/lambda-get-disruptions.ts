import {findAllDisruptions} from "../../service/disruptions";
import {responseByMethod} from "../../../../../common/api/lambda-http";

export async function handlerFn(): Promise<any> {
    return await findAllDisruptions();
}

export const handler = responseByMethod(handlerFn);
