import * as ServicesService from "../../service/services";
import {Service} from "../../model/service";

export const handler = (): Promise<Service[]> => {
    return ServicesService.findAll();
};
