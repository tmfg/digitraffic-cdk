import {Annotation} from "../../model/annotations";
import {login, getAnnotations, LoginResponse} from "../../api/api-annotations";
import {insert} from "../../db/db-annotations";
import {initDbConnection} from "../../../../common/postgres/database";
import {getLastUpdated, updateLastUpdated} from "../../db/db-last-updated";

export const handler = async () : Promise <any> => {
    const timestampFrom = await lastUpdated();
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
        const loginResponse = <LoginResponse> await login(endpointUser, endpointPass, loginUrl);

        if(loginResponse.status == "success") {
            console.info("login successfull!");

            return await getAnnotations(loginResponse.data.userId, loginResponse.data.authToken, endpointUrl, timestampFrom, timeStampTo);
        } else {
            console.error("Could not login! " + loginResponse);
        }
    } catch(e) {
        console.error('Error', e);
    }

    return [];
}

async function lastUpdated() {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    try {
        const timestamp = await getLastUpdated(db)

        return timestamp == null ? new Date() : timestamp;
    } finally {
        if (db != null) {
            db.$pool.end()
        }
    }
}

async function saveAnnotations(annotations: Annotation[], timeStampTo: Date) {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    try {
        await insert(db, annotations);
        await updateLastUpdated(db, timeStampTo);
    } finally {
        if (db != null) {
            db.$pool.end()
        }
    }
}
