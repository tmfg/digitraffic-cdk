import {getSubjects} from '../../api/api-subjects';
import {update} from "../../service/subjects";
import {SubjectLocale} from "../../model/subject";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const subjects = await Promise.all([
        getSubjects(endpointUser, endpointPass, endpointUrl, SubjectLocale.FINNISH),
        getSubjects(endpointUser, endpointPass, endpointUrl, SubjectLocale.SWEDISH),
        getSubjects(endpointUser, endpointPass, endpointUrl, SubjectLocale.ENGLISH)
    ]);
    await update(subjects.flat());
};
