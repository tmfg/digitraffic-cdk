import {getSubjects} from '../../api/api-subjects';
import {update} from "../../service/subjects";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    try {
        const subjects = await getSubjects(endpointUser, endpointPass, endpointUrl);
        await update(subjects);
    } catch (e) {
        console.error('Error', e);
        return;
    }
};
