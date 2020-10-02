import {getSubSubjects} from '../../api/api-subsubjects';
import {update} from "../../service/subsubjects";
import {SubjectLocale} from "../../model/subject";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const subSubjects = await Promise.all([
        getSubSubjects(endpointUser, endpointPass, endpointUrl, SubjectLocale.FINNISH),
        getSubSubjects(endpointUser, endpointPass, endpointUrl, SubjectLocale.SWEDISH),
        getSubSubjects(endpointUser, endpointPass, endpointUrl, SubjectLocale.ENGLISH)
    ]);
    await update(subSubjects.flat());
};
