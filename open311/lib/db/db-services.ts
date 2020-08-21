import {Service} from "../model/service";
import {IDatabase, PreparedStatement} from "pg-promise";

interface ServiceServiceCode {
    readonly service_code: string;
}

const SELECT_REQUEST = `SELECT service_code,
                               service_name,
                               description,
                               metadata,
                               type,
                               keywords,
                               "group"
                        FROM open311_service`;

export function update(
    services: Service[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        t.none('DELETE FROM open311_service');
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
                                    $(group))
                            ON CONFLICT (service_code) DO UPDATE SET
                                    service_name = $(service_name),
                                    description = $(description),
                                    metadata = $(metadata),
                                    type = $(type),
                                    keywords = $(keywords),
                                    "group" = $(group)`, createEditObject(service));
        });
        return t.batch(queries);
    });
}

export function findAllServiceCodes(db: IDatabase<any, any>): Promise<ServiceServiceCode[]> {
    return db.manyOrNone("SELECT service_code FROM open311_service");
}

export function findAll(db: IDatabase<any, any>): Promise<Service[]> {
    return db.manyOrNone(`${SELECT_REQUEST} ORDER BY service_code`).then(requests => requests.map(r => toService(r)));
}

export function find(
    service_request_id: string,
    db: IDatabase<any, any>
): Promise<Service | null > {
    const ps = new PreparedStatement({
        name: 'find-service-by-id',
        text: `${SELECT_REQUEST} WHERE service_code = $1`,
        values: [service_request_id]
    });
    return db.oneOrNone(ps).then(r => r == null ? null : toService(r));
}

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