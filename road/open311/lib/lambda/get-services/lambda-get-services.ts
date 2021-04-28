import * as ServicesService from "../../service/services";

export const handler = async (): Promise<any> => {
    return await ServicesService.findAll();
};
