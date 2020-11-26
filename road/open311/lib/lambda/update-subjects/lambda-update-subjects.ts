import {getSubjects} from '../../api/api-subjects';
import {update} from "../../service/subjects";
import {Locale} from "../../model/locale";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const subjects = await Promise.all([
        getSubjects(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        getSubjects(endpointUser, endpointPass, endpointUrl, Locale.SWEDISH),
        getSubjects(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH)
    ]);
    await update(subjects.flat());
};
