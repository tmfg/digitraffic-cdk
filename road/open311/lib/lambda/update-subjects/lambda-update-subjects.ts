import * as SubjectsApi from '../../api/subjects';
import {update} from "../../service/subjects";
import {Locale} from "../../model/locale";

export const handler = async (): Promise<void> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const subjects = await Promise.all([
        SubjectsApi.getSubjects(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        SubjectsApi.getSubjects(endpointUser, endpointPass, endpointUrl, Locale.SWEDISH),
        SubjectsApi.getSubjects(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH),
    ]);
    await update(subjects.flat());
};
