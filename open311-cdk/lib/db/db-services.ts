import {Service} from "../model/service";
import * as pgPromise from "pg-promise";
import {ServiceRequest} from "../model/service-request";

export function insert(db: pgPromise.IDatabase<any, any>, services: Service[]): Promise<void> {
    return db.tx(t => {
        const queries: any[] = services.map(service => {
            return t.none(
                `INSERT INTO open311_service(service_code,
                            service_name,
                            description,
                            metadata,
                            type,
                            keywords,
                            "group")
                            VALUES ($(service_code),
                                   $(service_name),
                                   $(description),
                                   $(metadata),
                                   $(type),
                                   $(keywords),
                                   $(group))`, createEditObject(service));
        });
        return t.batch(queries);
    });
}

export function findAll(db: pgPromise.IDatabase<any, any>): Promise<Service[]> {
    return db.manyOrNone(SELECT_REQUEST).then(requests => requests.map(r => toService(r)));
}

export function find(db: pgPromise.IDatabase<any, any>, service_request_id: string): Promise<Service | null > {
    return db.oneOrNone(`${SELECT_REQUEST} WHERE service_code = $1`, service_request_id).then(r => r == null ? null : toService(r));
}

const SELECT_REQUEST = `SELECT service_code,
                               service_name,
                               description,
                               metadata,
                               type,
                               keywords,
                               "group"
                        FROM open311_service`;

function toService(s: any): Service {
    return {
        service_code: s.service_code,
        service_name: s.service_name,
        description: s.description,
        metadata: s.metadata,
        type: s.type,
        keywords: s.keywords,
        group: s.group
    };
}


/**
 * Creates an object with all necessary properties for pg-promise
 */
function createEditObject(service: Service): Service {
    return Object.assign({
        service_code: undefined,
        service_name: undefined,
        description: undefined,
        metadata: undefined,
        type: undefined,
        keywords: undefined,
        group: undefined
    }, service);
}