import {updateDatex2} from "../../service/variable-sign-updater";

export const handler = async (event: any): Promise<any> => {
    const datex2 = event.body;

    console.log('got event ' + JSON.stringify(event));

    if(datex2) {
        return await updateDatex2(datex2);
    }

    return {statusCode:500};
};
