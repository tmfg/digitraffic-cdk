import * as SubSubjectsApi from '../../api/subsubjects';
import {update} from "../../service/subsubjects";
import {Locale} from "../../model/locale";

export const handler = async (): Promise<void> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const subSubjects = await Promise.all([
        SubSubjectsApi.getSubSubjects(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        SubSubjectsApi.getSubSubjects(endpointUser, endpointPass, endpointUrl, Locale.SWEDISH),
        SubSubjectsApi.getSubSubjects(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH),
    ]);
    await update(subSubjects.flat());
};
