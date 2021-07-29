import {Annotation} from "../../model/annotations";
import * as AnnotationsApi from "../../api/annotations";
import {saveAnnotations} from "../../service/annotations";
import {lastUpdated} from "../../service/last-updated";
import {LoginResponse} from "../../api/annotations";

export const handler = async () : Promise <any> => {
    const updated = await lastUpdated();
    const timestampFrom = updated;
    updated.setMinutes(updated.getMinutes() - 5); // overlap a bit, just to be safe
    
    const timeStampTo = new Date();
    const annotations = await getAnnotationsFromServer(timestampFrom, timeStampTo);

    await saveAnnotations(annotations, timeStampTo);
};

async function getAnnotationsFromServer(timestampFrom: Date, timeStampTo: Date):Promise<Annotation[]> {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const loginUrl = process.env.ENDPOINT_LOGIN_URL as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;

    try {
        const loginResponse = <LoginResponse> await AnnotationsApi.login(endpointUser, endpointPass, loginUrl);

        if(loginResponse.status === "success") {
            const newAnnotations = await AnnotationsApi.getAnnotations(loginResponse.data.userId, loginResponse.data.authToken, endpointUrl, timestampFrom, timeStampTo, false);
            const updatedAnnotations = await AnnotationsApi.getAnnotations(loginResponse.data.userId, loginResponse.data.authToken, endpointUrl, timestampFrom, timeStampTo, true);

            return newAnnotations.concat(updatedAnnotations);
        } else {
            console.error("Could not login! loginResponse=%s ", loginResponse);
        }
    } catch(e) {
        console.error('Error', e);
    }

    return [];
}