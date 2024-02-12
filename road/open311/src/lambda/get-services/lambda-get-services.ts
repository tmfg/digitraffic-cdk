import * as ServicesService from "../../service/services.js";
import type { Service } from "../../model/service.js";

export const handler = (): Promise<Service[]> => {
    return ServicesService.findAll();
};
