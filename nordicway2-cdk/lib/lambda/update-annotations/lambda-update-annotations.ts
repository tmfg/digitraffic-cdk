import {Annotation} from "../../model/annotations";
import {login, getAnnotations, LoginResponse} from "../../api/api-annotations";
import {insert} from "../../db/db-annotations";
import {initDbConnection} from "../../../../common/postgres/database";

export const handler = async () : Promise <any> => {
    const annotations = await getAnnotationsFromServer();

    await saveAnnotations(annotations);
};

async function getAnnotationsFromServer():Promise<Annotation[]> {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const loginUrl = process.env.ENDPOINT_LOGIN_URL as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;

    try {
        const loginResponse = <LoginResponse> await login(endpointUser, endpointPass, loginUrl);

        if(loginResponse.status == "success") {
            console.info("login successfull!");
            return await getAnnotations(loginResponse.data.userId, loginResponse.data.authToken, endpointUrl);
        } else {
            console.error("Could not login! " + loginResponse);
        }
    } catch(e) {
        console.error('Error', e);
    }

    return [];
}

async function saveAnnotations(annotations: Annotation[]) {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    await insert(db, annotations);
}
