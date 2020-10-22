import {getSubSubjects} from '../../api/api-subsubjects';
import {update} from "../../service/subsubjects";
import {Locale} from "../../model/locale";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const subSubjects = await Promise.all([
        getSubSubjects(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        getSubSubjects(endpointUser, endpointPass, endpointUrl, Locale.SWEDISH),
        getSubSubjects(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH)
    ]);
    await update(subSubjects.flat());
};
