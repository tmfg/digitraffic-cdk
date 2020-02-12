import * as pgPromise from "pg-promise";
import {ServiceRequestState} from "../model/service-request-state";

export function findAll(db: pgPromise.IDatabase<any, any>): Promise<ServiceRequestState[]> {
    return db.manyOrNone("SELECT key, name FROM open311_service_request_state ORDER BY key").then(requests => requests.map(r => toServiceRequestState(r)));
}

export function update(db: pgPromise.IDatabase<any, any>, states: ServiceRequestState[]): Promise<void> {
    return db.tx(t => {
        const queries: any[] = states.map(state => {
            return t.none(
                `INSERT INTO open311_service_request_state(key,
                                    name)
                            VALUES ($(key),
                                    $(name))
                            ON CONFLICT (key) DO UPDATE SET
                                    name = $(name)`, state);
        });
        return t.batch(queries);
    });
}

function toServiceRequestState(r: any): ServiceRequestState {
    return {
        key: r.key,
        name: r.name
    };
}
