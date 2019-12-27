import {Annotation} from "../../model/annotations";
import {login, getAnnotations, LoginResponse} from "../../api/api-annotations";
import * as AnnotationsDB from "../../db/db-annotations";
import {inDatabase} from "../../../../common/postgres/database";
import * as LastUpdatedDB from "../../db/db-last-updated";
import * as pgPromise from "pg-promise";

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

function lastUpdated() {
    return inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const timestamp = await LastUpdatedDB.getLastUpdated(db)

        return timestamp == null ? new Date() : timestamp;
    });
}

async function saveAnnotations(annotations: Annotation[], timeStampTo: Date) {
    console.info("updateCount=" + annotations.length);

    await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        console.info("inDatabase saveAnnotations");

        await db.tx(t => {
            console.info("inDatabase inside transaction saveAnnotations");
            return t.batch(
                AnnotationsDB.updateAnnotations(db, annotations),
                LastUpdatedDB.updateLastUpdated(db, timeStampTo)
            );
        });
    });
}
