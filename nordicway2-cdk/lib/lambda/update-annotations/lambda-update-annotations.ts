import {Annotation} from "../../model/annotations";
import {login, getAnnotations, LoginResponse} from "../../api/api-annotations";

export const handler = async () : Promise <any> => {
    const annotations = getAnnotationsFromServer();

    saveAnnotations(annotations);
};

async function getAnnotationsFromServer():Annotation[] {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const loginUrl = process.env.ENDPOINT_LOGIN_URL as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;

    try {
        const loginResponse = <LoginResponse> await login(endpointUser, endpointPass, loginUrl);

        if(loginResponse.status == "success") {
            return await getAnnotations(loginResponse.data.userId, loginResponse.data.authToken, endpointUrl);
        } else {
            console.error("Could not login!");
        }
    } catch(e) {
        console.error('Error', e);
    }

    return [];
}

function saveAnnotations(annotations: Annotation[]) {

}
